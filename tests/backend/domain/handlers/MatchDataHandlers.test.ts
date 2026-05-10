import { describe, test, expect, beforeEach } from "bun:test";
import { getMapRadarAssetsCommandHandler } from "@demo-viewer/domain/src/handlers/GetMapRadarAssetsCommandHandler.ts";
import { getMatchManifestCommandHandler } from "@demo-viewer/domain/src/handlers/GetMatchManifestCommandHandler.ts";
import { getTickSeekReadableStreamCommandHandler } from "@demo-viewer/domain/src/handlers/GetTickSeekReadableStreamCommandHandler.ts";
import { getPaginatedMatchesHandler } from "@demo-viewer/domain/src/handlers/GetPaginatedMatchesHandler.ts";
import { getMatchPlayerStatsHandler } from "@demo-viewer/domain/src/handlers/GetMatchPlayerStatsCommandHandler.ts";
import { DomainNotFoundError } from "@demo-viewer/domain/src/lib/errors/DomainErrors.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeManifestStream = (manifest: object) => ({
  preflight: { contentType: "application/json" },
  stream: () => new Response(JSON.stringify(manifest)).body!,
});

const makeMatch = (overrides: Record<string, unknown> = {}) => ({
  id: "match1",
  demoId: "demo1",
  mapId: "de_dust2",
  mapName: "Dust 2",
  serverName: "game-server.example.com",
  participants: [
    { steamId: "76561198000000001", userId: "u1", playerName: "Alice", isBot: false },
    { steamId: "76561198000000002", userId: "u2", playerName: "Bot_Bob", isBot: true },
  ],
  rounds: [
    { roundNumber: 1, winner: "CT", startDemoTick: 100, endDemoTick: 500, startGameTick: 10, endGameTick: 50 },
    { roundNumber: 2, winner: "T", startDemoTick: 501, endDemoTick: 900, startGameTick: 51, endGameTick: 90 },
  ],
  outcome: { totalRounds: 2, winner: "CT", tScore: 0, ctScore: 2 },
  tickRate: 64,
  playbackTicks: 10000,
  ...overrides,
});

const makeStats = () => ({
  _analyticsType: "stats" as const,
  participantSteamId: "76561198000000001",
  matchId: "match1",
  totalKills: 10,
  totalDeaths: 5,
  totalAssists: 3,
  totalMvps: 2,
  totalScore: 20,
  totalRoundsPlayed: 16,
  totalUtilityDamage: 100,
  totalAdr: 80,
  totalHs: 0.4,
  totalKpr: 0.625,
  totalApr: 0.1875,
  createdAt: new Date(),
  updatedAt: new Date(),
  dateRecorded: new Date(),
});

// ---------------------------------------------------------------------------
// GetMapRadarAssetsCommandHandler
// ---------------------------------------------------------------------------

describe("GetMapRadarAssetsCommandHandler", () => {
  const makeOutbound = (overrides: Record<string, unknown> = {}) =>
    ({
      configuration: {
        getMapRadarFileAssetsPath: (mapId: string) => `/assets/radar/${mapId}`,
        getMapRadarApiPath: (mapId: string, layer: string) => `/api/radar/${mapId}/${layer}`,
        matchesPageSize: 10,
        transientEventsLookbackTicks: 128,
      },
      fileStorage: {
        getAsset: async () => "asset-content",
        streamAsset: async () => null,
        lsMapRadar: async () => ({}),
      },
      ...overrides,
    }) as any;

  test("happy path: getAsset returns asset string → returns { asset }", async () => {
    const outbound = makeOutbound({
      fileStorage: {
        getAsset: async () => "radar-image-data",
      },
    });

    const handler = getMapRadarAssetsCommandHandler(outbound);
    const result = await handler({ type: "get_map_radar_assets", mapId: "de_dust2", layer: "0" });

    expect(result).toEqual({ asset: "radar-image-data" });
  });

  test("asset not found: getAsset returns null → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      fileStorage: {
        getAsset: async () => null,
      },
    });

    const handler = getMapRadarAssetsCommandHandler(outbound);
    await expect(
      handler({ type: "get_map_radar_assets", mapId: "de_dust2", layer: "0" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("path construction: path passed to getAsset is `${getMapRadarFileAssetsPath(mapId)}/${layer}`", async () => {
    let capturedPath: string | null = null;

    const outbound = makeOutbound({
      fileStorage: {
        getAsset: async (path: string) => {
          capturedPath = path;
          return "some-asset";
        },
      },
    });

    const handler = getMapRadarAssetsCommandHandler(outbound);
    await handler({ type: "get_map_radar_assets", mapId: "de_mirage", layer: "overview" });

    expect(capturedPath).toBe("/assets/radar/de_mirage/overview");
  });
});

// ---------------------------------------------------------------------------
// GetMatchManifestCommandHandler
// ---------------------------------------------------------------------------

describe("GetMatchManifestCommandHandler", () => {
  const sampleManifest = {
    resolution: 5.5,
    offset: { x: -2476, y: 3239 },
    zRange: { min: -100, max: 900 },
    survivableDistance: [100, 200],
  };

  const sampleRadarLayers: Record<number | "buyzones" | "manifest", string> = {
    0: "/api/radar/de_dust2/overview.png",
    buyzones: "/api/radar/de_dust2/buyzones.png",
    manifest: "/api/radar/de_dust2/manifest.json",
  };

  const makeOutbound = (overrides: Record<string, unknown> = {}) =>
    ({
      configuration: {
        getMapRadarFileAssetsPath: (mapId: string) => `/assets/radar/${mapId}`,
        getMapRadarApiPath: (mapId: string, layer: string) => `/api/radar/${mapId}/${layer}`,
        matchesPageSize: 10,
        transientEventsLookbackTicks: 128,
      },
      matchRepository: {
        findByMatchId: async () => makeMatch(),
      },
      fileStorage: {
        lsMapRadar: async () => sampleRadarLayers,
        streamAsset: async () => makeManifestStream(sampleManifest),
      },
      ...overrides,
    }) as any;

  test("happy path: match found, lsMapRadar resolves, streamAsset returns stream → correct shape", async () => {
    const outbound = makeOutbound();
    const handler = getMatchManifestCommandHandler(outbound);
    const result = await handler({ type: "get_match_manifest", matchId: "match1" });

    expect(result.mapName).toBe("Dust 2");
    expect(result.mapServer).toBe("game-server.example.com");
    expect(result.demoId).toBe("demo1");
    expect(result.tickRate).toBe(64);
    expect(result.totalTicks).toBe(10000);
    expect(result.mapRadarLayers).toEqual(sampleRadarLayers);
    expect(result.mapManifest).toEqual(sampleManifest);
    expect(result.outcome).toEqual({ winner: "CT", tScore: 0, ctScore: 2 });
  });

  test("match not found → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => null,
      },
    });

    const handler = getMatchManifestCommandHandler(outbound);
    await expect(
      handler({ type: "get_match_manifest", matchId: "nonexistent" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("lsMapRadar throws → throws DomainNotFoundError with correct message", async () => {
    const match = makeMatch({ mapId: "de_inferno" });
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => match,
      },
      fileStorage: {
        lsMapRadar: async () => { throw new Error("storage error"); },
        streamAsset: async () => makeManifestStream(sampleManifest),
      },
    });

    const handler = getMatchManifestCommandHandler(outbound);
    await expect(
      handler({ type: "get_match_manifest", matchId: "match1" }),
    ).rejects.toThrow(new DomainNotFoundError("Map asset for id:de_inferno not found"));
  });

  test("streamAsset returns null → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      fileStorage: {
        lsMapRadar: async () => sampleRadarLayers,
        streamAsset: async () => null,
      },
    });

    const handler = getMatchManifestCommandHandler(outbound);
    await expect(
      handler({ type: "get_match_manifest", matchId: "match1" }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("participants mapped correctly: name, steamId, userId, isBot all passed through", async () => {
    const outbound = makeOutbound();
    const handler = getMatchManifestCommandHandler(outbound);
    const result = await handler({ type: "get_match_manifest", matchId: "match1" });

    expect(result.participants).toEqual([
      { name: "Alice", steamId: "76561198000000001", userId: "u1", isBot: false },
      { name: "Bot_Bob", steamId: "76561198000000002", userId: "u2", isBot: true },
    ]);
  });

  test("rounds mapped correctly: all round fields passed through", async () => {
    const outbound = makeOutbound();
    const handler = getMatchManifestCommandHandler(outbound);
    const result = await handler({ type: "get_match_manifest", matchId: "match1" });

    expect(result.rounds).toEqual([
      { roundNumber: 1, winner: "CT", startDemoTick: 100, endDemoTick: 500, startGameTick: 10, endGameTick: 50 },
      { roundNumber: 2, winner: "T", startDemoTick: 501, endDemoTick: 900, startGameTick: 51, endGameTick: 90 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// GetTickSeekReadableStreamCommandHandler
// ---------------------------------------------------------------------------

describe("GetTickSeekReadableStreamCommandHandler", () => {
  const sampleFrames = [{ tick: 100, players: [] }, { tick: 110, players: [] }] as any;
  const sampleTransientEvents = [{ type: "kill", tick: 95 }] as any;

  const makeOutbound = (overrides: Record<string, unknown> = {}) =>
    ({
      configuration: {
        getMapRadarFileAssetsPath: (mapId: string) => `/assets/radar/${mapId}`,
        getMapRadarApiPath: (mapId: string, layer: string) => `/api/radar/${mapId}/${layer}`,
        matchesPageSize: 10,
        transientEventsLookbackTicks: 128,
      },
      matchRepository: {
        findByMatchId: async () => makeMatch(),
        getTicksRange: async () => sampleFrames,
        getTransientEventsAtTick: async () => sampleTransientEvents,
      },
      ...overrides,
    }) as any;

  test("happy path, no transient events: returns { frames, transientEvents: undefined }", async () => {
    const outbound = makeOutbound();
    const handler = getTickSeekReadableStreamCommandHandler(outbound);
    const result = await handler({
      type: "get_tick_seek_readable_stream",
      matchId: "match1",
      startGameTick: 100,
      endGameTick: 200,
      step: 1,
      includeTransientEvents: false,
    });

    expect(result.frames).toEqual(sampleFrames);
    expect(result.transientEvents).toBeUndefined();
  });

  test("happy path, with transient events: getTransientEventsAtTick called, events included", async () => {
    let transientCallArgs: unknown[] | null = null;
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => makeMatch(),
        getTicksRange: async () => sampleFrames,
        getTransientEventsAtTick: async (demoId: string, tick: number, lookback: number) => {
          transientCallArgs = [demoId, tick, lookback];
          return sampleTransientEvents;
        },
      },
    });

    const handler = getTickSeekReadableStreamCommandHandler(outbound);
    const result = await handler({
      type: "get_tick_seek_readable_stream",
      matchId: "match1",
      startGameTick: 100,
      endGameTick: 200,
      step: 1,
      includeTransientEvents: true,
    });

    expect(result.frames).toEqual(sampleFrames);
    expect(result.transientEvents).toEqual(sampleTransientEvents);
    expect(transientCallArgs).toEqual(["demo1", 100, 128]);
  });

  test("match not found → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => null,
        getTicksRange: async () => sampleFrames,
        getTransientEventsAtTick: async () => sampleTransientEvents,
      },
    });

    const handler = getTickSeekReadableStreamCommandHandler(outbound);
    await expect(
      handler({
        type: "get_tick_seek_readable_stream",
        matchId: "nonexistent",
        startGameTick: 100,
        endGameTick: 200,
        step: 1,
      }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("empty ticks array returned → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => makeMatch(),
        getTicksRange: async () => [],
        getTransientEventsAtTick: async () => [],
      },
    });

    const handler = getTickSeekReadableStreamCommandHandler(outbound);
    await expect(
      handler({
        type: "get_tick_seek_readable_stream",
        matchId: "match1",
        startGameTick: 100,
        endGameTick: 200,
        step: 1,
      }),
    ).rejects.toThrow(DomainNotFoundError);
  });

  test("null ticks returned → throws DomainNotFoundError", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        findByMatchId: async () => makeMatch(),
        getTicksRange: async () => null,
        getTransientEventsAtTick: async () => [],
      },
    });

    const handler = getTickSeekReadableStreamCommandHandler(outbound);
    await expect(
      handler({
        type: "get_tick_seek_readable_stream",
        matchId: "match1",
        startGameTick: 100,
        endGameTick: 200,
        step: 1,
      }),
    ).rejects.toThrow(DomainNotFoundError);
  });
});

// ---------------------------------------------------------------------------
// GetPaginatedMatchesHandler
// ---------------------------------------------------------------------------

describe("GetPaginatedMatchesHandler", () => {
  const makeMatchItem = (overrides: Record<string, unknown> = {}) => ({
    id: "match1",
    demoId: "demo1",
    mapName: "Dust 2",
    participants: [
      { steamId: "76561198000000001", playerName: "Alice", isBot: false },
      { steamId: "76561198000000002", playerName: "Bob", isBot: false },
    ],
    rounds: [{}, {}, {}] as any,
    outcome: { winner: "CT", ctScore: 2, tScore: 1 },
    ...overrides,
  });

  const makeOutbound = (overrides: Record<string, unknown> = {}) =>
    ({
      configuration: {
        getMapRadarFileAssetsPath: (mapId: string) => `/assets/radar/${mapId}`,
        getMapRadarApiPath: (mapId: string, layer: string) => `/api/radar/${mapId}/${layer}`,
        matchesPageSize: 10,
        transientEventsLookbackTicks: 128,
      },
      matchRepository: {
        getTotalMatches: async () => 25,
        getMatches: async () => [makeMatchItem()],
      },
      steamUserRepository: {
        getPlayerSummaries: async () => [
          { steamId: "76561198000000001", avatarUrl: "https://avatar1.png" },
          { steamId: "76561198000000002", avatarUrl: "https://avatar2.png" },
        ],
      },
      ...overrides,
    }) as any;

  test("happy path page 1: returns correct totalPages, page items, avatars from summaries", async () => {
    const outbound = makeOutbound();
    const handler = getPaginatedMatchesHandler(outbound);
    const result = await handler({ type: "get_paginated_matchers", page: 1 });

    expect(result.totalItems).toBe(25);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(result.page).toHaveLength(1);

    const item = result.page[0];
    expect(item.map).toBe("Dust 2");
    expect(item.demoId).toBe("demo1");
    expect(item.matchId).toBe("match1");
    expect(item.outcome).toEqual({ totalRounds: 3, ctWins: 2, tWins: 1, winner: "CT" });
    expect(item.players).toEqual([
      { name: "Alice", steamId: "76561198000000001", avatar: "https://avatar1.png" },
      { name: "Bob", steamId: "76561198000000002", avatar: "https://avatar2.png" },
    ]);
  });

  test("page 2: skip = (2-1) * pageSize correctly computed", async () => {
    let capturedSkip: number | null = null;
    let capturedTake: number | null = null;

    const outbound = makeOutbound({
      matchRepository: {
        getTotalMatches: async () => 25,
        getMatches: async (skip: number, take: number) => {
          capturedSkip = skip;
          capturedTake = take;
          return [makeMatchItem()];
        },
      },
    });

    const handler = getPaginatedMatchesHandler(outbound);
    await handler({ type: "get_paginated_matchers", page: 2 });

    expect(capturedSkip).toBe(10);
    expect(capturedTake).toBe(10);
  });

  test("participants without steamId filtered out from summaries query", async () => {
    let capturedSteamIds: string[] | null = null;

    const matchWithBot = makeMatchItem({
      participants: [
        { steamId: "76561198000000001", playerName: "Alice", isBot: false },
        { steamId: undefined, playerName: "Bot_One", isBot: true },
        { steamId: null, playerName: "Bot_Two", isBot: true },
      ],
    });

    const outbound = makeOutbound({
      matchRepository: {
        getTotalMatches: async () => 1,
        getMatches: async () => [matchWithBot],
      },
      steamUserRepository: {
        getPlayerSummaries: async (ids: string[]) => {
          capturedSteamIds = ids;
          return [{ steamId: "76561198000000001", avatarUrl: "https://avatar1.png" }];
        },
      },
    });

    const handler = getPaginatedMatchesHandler(outbound);
    const result = await handler({ type: "get_paginated_matchers", page: 1 });

    // Only the real steam ID is passed
    expect(capturedSteamIds).toEqual(["76561198000000001"]);

    // Bots show empty string avatar
    const players = result.page[0].players;
    expect(players.find((p) => p.name === "Bot_One")?.avatar).toBe("");
    expect(players.find((p) => p.name === "Bot_Two")?.avatar).toBe("");
  });

  test("avatar mapping: steamId with avatar → correct avatar; missing → empty string", async () => {
    const matchWithMixedPlayers = makeMatchItem({
      participants: [
        { steamId: "steam-has-avatar", playerName: "Player1", isBot: false },
        { steamId: "steam-no-avatar", playerName: "Player2", isBot: false },
      ],
    });

    const outbound = makeOutbound({
      matchRepository: {
        getTotalMatches: async () => 1,
        getMatches: async () => [matchWithMixedPlayers],
      },
      steamUserRepository: {
        getPlayerSummaries: async () => [
          // only first player returned from steam
          { steamId: "steam-has-avatar", avatarUrl: "https://avatar.png" },
        ],
      },
    });

    const handler = getPaginatedMatchesHandler(outbound);
    const result = await handler({ type: "get_paginated_matchers", page: 1 });

    const players = result.page[0].players;
    expect(players.find((p) => p.name === "Player1")?.avatar).toBe("https://avatar.png");
    expect(players.find((p) => p.name === "Player2")?.avatar).toBe("");
  });

  test("deduplication: same steamId in multiple matches → getPlayerSummaries called with deduped list", async () => {
    let capturedSteamIds: string[] | null = null;

    const match1 = makeMatchItem({
      id: "match1",
      participants: [
        { steamId: "steam-shared", playerName: "Alice", isBot: false },
        { steamId: "steam-only-match1", playerName: "Bob", isBot: false },
      ],
    });
    const match2 = makeMatchItem({
      id: "match2",
      participants: [
        { steamId: "steam-shared", playerName: "Alice", isBot: false },
        { steamId: "steam-only-match2", playerName: "Charlie", isBot: false },
      ],
    });

    const outbound = makeOutbound({
      matchRepository: {
        getTotalMatches: async () => 2,
        getMatches: async () => [match1, match2],
      },
      steamUserRepository: {
        getPlayerSummaries: async (ids: string[]) => {
          capturedSteamIds = ids;
          return [];
        },
      },
    });

    const handler = getPaginatedMatchesHandler(outbound);
    await handler({ type: "get_paginated_matchers", page: 1 });

    expect(capturedSteamIds).not.toBeNull();
    // "steam-shared" should appear only once
    const sharedCount = capturedSteamIds!.filter((id) => id === "steam-shared").length;
    expect(sharedCount).toBe(1);
    expect(capturedSteamIds!).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// GetMatchPlayerStatsCommandHandler
// ---------------------------------------------------------------------------

describe("GetMatchPlayerStatsCommandHandler", () => {
  const makeOutbound = (overrides: Record<string, unknown> = {}) =>
    ({
      configuration: {
        getMapRadarFileAssetsPath: (mapId: string) => `/assets/radar/${mapId}`,
        getMapRadarApiPath: (mapId: string, layer: string) => `/api/radar/${mapId}/${layer}`,
        matchesPageSize: 10,
        transientEventsLookbackTicks: 128,
      },
      matchRepository: {
        getMatchPlayerStats: async () => null,
        findByMatchId: async () => makeMatch(),
        getAggregatedEvents: async () => [[], [], [], []],
        getRoundsPlayedByPlayer: async () => [],
        getPlayerFinalStateForMatch: async () => ({ mvps: 0, score: 0 }),
      },
      ...overrides,
    }) as any;

  test("stats found in repo: returned directly, calculator never invoked", async () => {
    const expectedStats = makeStats();
    const outbound = makeOutbound({
      matchRepository: {
        getMatchPlayerStats: async () => expectedStats,
      },
    });

    const handler = getMatchPlayerStatsHandler(outbound);
    const result = await handler({
      type: "get_match_player_stats",
      matchId: "match1",
      steamId: "76561198000000001",
    });

    expect(result).toEqual({ stats: expectedStats });
  });

  test("stats not in repo: calculator computes stats from repo calls", async () => {
    // getMatchPlayerStats returns null → handler falls through to calculator
    // The calculator will call getAggregatedEvents, getRoundsPlayedByPlayer, getPlayerFinalStateForMatch
    // We set them up to return enough data to produce a non-null result
    const outbound = makeOutbound({
      matchRepository: {
        getMatchPlayerStats: async () => null,
        findByMatchId: async () => makeMatch(),
        getAggregatedEvents: async () => [
          // killEvents (as killer), deathEvents (as victim), assistEvents (as assister), hurtEvents (as attacker)
          [],
          [],
          [],
          [],
        ],
        getRoundsPlayedByPlayer: async () => [{ roundNumber: 1 }],
        getPlayerFinalStateForMatch: async () => ({ mvps: 2, score: 15 }),
      },
    });

    const handler = getMatchPlayerStatsHandler(outbound);
    const result = await handler({
      type: "get_match_player_stats",
      matchId: "match1",
      steamId: "76561198000000001",
    });

    // Calculator always returns a PlayerStatsEntity when called
    expect(result.stats).toBeDefined();
    expect(result.stats._analyticsType).toBe("stats");
    expect(result.stats.participantSteamId).toBe("76561198000000001");
    expect(result.stats.matchId).toBe("match1");
    expect(result.stats.totalMvps).toBe(2);
    expect(result.stats.totalScore).toBe(15);
  });

  test("stats found in repo: handler does not call getAggregatedEvents (calculator never runs)", async () => {
    const expectedStats = makeStats();
    let aggregatedEventsCalled = false;

    const outbound = makeOutbound({
      matchRepository: {
        getMatchPlayerStats: async () => expectedStats,
        getAggregatedEvents: async () => {
          aggregatedEventsCalled = true;
          return [[], [], [], []];
        },
        findByMatchId: async () => makeMatch(),
        getRoundsPlayedByPlayer: async () => [],
        getPlayerFinalStateForMatch: async () => ({ mvps: 0, score: 0 }),
      },
    });

    const handler = getMatchPlayerStatsHandler(outbound);
    await handler({
      type: "get_match_player_stats",
      matchId: "match1",
      steamId: "76561198000000001",
    });

    // Calculator was never invoked since stats were found directly in repo
    expect(aggregatedEventsCalled).toBe(false);
  });
});
