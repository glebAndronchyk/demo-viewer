import { describe, test, expect, beforeEach } from "bun:test";
import { getPlayerWeaponAnalyticsHandler } from "@demo-viewer/domain/src/handlers/GetPlayerWeaponAnalyticsCommandHandler.ts";
import { getPlayerEconomyAnalyticsHandler } from "@demo-viewer/domain/src/handlers/GetPlayerEconomyAnalyticsCommandHandler.ts";
import { getTotalPlayerStatsHandler } from "@demo-viewer/domain/src/handlers/GetTotalPlayerStatsCommandHandler.ts";
import { seekNextAvailableMatchForAnalyticsAggregationHandler } from "@demo-viewer/domain/src/handlers/SeekNextAvailableMatchForAnalyticsAggregation.ts";
import { downloadAndParseDemoCommandHandler } from "@demo-viewer/domain/src/handlers/DownloadAndParseDemoCommandHandler.ts";
import {
  DomainNotFoundError,
  DomainUnavailableError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDate = () => new Date("2024-01-01T00:00:00Z");

const makeOutbound = (overrides: any = {}) => ({
  matchRepository: {
    aggregateWeaponUsagePct: async () => ({ _analyticsType: "weapons_usage" as const }),
    aggregateWeaponStats: async () => ({ _analyticsType: "weapon_stats" as const }),
    aggregateUtilityUsage: async () => ({ _analyticsType: "utility" as const }),
    aggregateEconomyUsage: async () => ({ _analyticsType: "economy" as const }),
    getTotalPlayerStats: async () => null,
    getMatchesPerStep: async () => [],
    findByShareCode: async () => null,
    ...overrides.matchRepository,
  },
  gameCoordinatorRepository: {
    getNextAvailableShareCode: async () => ({ isSuccess: true, data: { nextCode: "CODE123" } }),
    getMatchUrlById: async () => ({ isSuccess: true, data: { url: "http://example.com/demo.dem" } }),
    pingMatchUrl: async () => ({ isSuccess: true }),
    ...overrides.gameCoordinatorRepository,
  },
  userRepository: {
    updateKnownShareCode: async () => {},
    ...overrides.userRepository,
  },
  parserRepository: {
    parseDemoFromRemote: () => ({ promise: Promise.resolve() }),
    ...overrides.parserRepository,
  },
  queue: {
    enqueue: async () => {},
    ...overrides.queue,
  },
  configuration: {
    matchesForAnalyticsSeekStep: 10,
    ...overrides.configuration,
  },
  // other repos not used by these handlers
  teamRepository: {},
  authRepository: {},
  notificationRepository: {},
  steamFriendsRepository: {},
  steamUserRepository: {},
  fileStorage: {},
} as any);

// ---------------------------------------------------------------------------
// GetPlayerWeaponAnalyticsCommandHandler
// ---------------------------------------------------------------------------

describe("GetPlayerWeaponAnalyticsCommandHandler", () => {
  const baseCommand = {
    type: "get_player_weapon_analytics" as const,
    steamId: "steam_abc",
    startDate: makeDate(),
  };

  const makeUtility = (fields: any = {}) => ({
    _analyticsType: "utility" as const,
    ...fields,
  });

  test("flashSuccessRate = 0 when flashesThrown is 0", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ flashesThrown: 0, enemiesFlashed: 5 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.flashSuccessRate).toBe(0);
  });

  test("flashSuccessRate = 0 when flashesThrown is undefined", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ enemiesFlashed: 3 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.flashSuccessRate).toBe(0);
  });

  test("flashSuccessRate = enemiesFlashed / flashesThrown when flashesThrown > 0", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ flashesThrown: 4, enemiesFlashed: 2 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.flashSuccessRate).toBe(0.5);
  });

  test("heSuccessRate = 1 when avg damage >= 30 (90 damage, 3 thrown)", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ heDamage: 90, heThrown: 3 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.heSuccessRate).toBe(1);
  });

  test("heSuccessRate = 0.66 when avg >= 15 (30 damage, 2 thrown)", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ heDamage: 30, heThrown: 2 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.heSuccessRate).toBe(0.66);
  });

  test("heSuccessRate = 0.33 when avg >= 5 (10 damage, 2 thrown)", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ heDamage: 10, heThrown: 2 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.heSuccessRate).toBe(0.33);
  });

  test("heSuccessRate = 0 when avg < 5", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ heDamage: 4, heThrown: 2 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.heSuccessRate).toBe(0);
  });

  test("heSuccessRate = 0 when heThrown = 0", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () => makeUtility({ heDamage: 100, heThrown: 0 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.heSuccessRate).toBe(0);
  });

  test("fireSuccessRate combines molotovsThrown + incendiariesThrown as thrown count", async () => {
    // 60 damage / (2 molotovs + 1 incendiary) = 20 per throw → avg >= 15 → 0.66
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () =>
          makeUtility({ molotovsDamage: 60, molotovsThrown: 2, incendiariesThrown: 1 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.fireSuccessRate).toBe(0.66);
  });

  test("fireSuccessRate = 1 when combined thrown gives avg >= 30", async () => {
    // 90 damage / (1 molotov + 2 incendiaries) = 30 per throw → avg >= 30 → 1
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({}),
        aggregateWeaponStats: async () => ({}),
        aggregateUtilityUsage: async () =>
          makeUtility({ molotovsDamage: 90, molotovsThrown: 1, incendiariesThrown: 2 }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result.utilityUsage.fireSuccessRate).toBe(1);
  });

  test("all three rates are present in utilityUsage of the result", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        aggregateWeaponUsagePct: async () => ({ weaponA: 0.5 }),
        aggregateWeaponStats: async () => ({ kills: 10 }),
        aggregateUtilityUsage: async () =>
          makeUtility({
            flashesThrown: 4,
            enemiesFlashed: 2,
            heDamage: 90,
            heThrown: 3,
            molotovsDamage: 90,
            molotovsThrown: 3,
            incendiariesThrown: 0,
          }),
      },
    });
    const handler = getPlayerWeaponAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect("flashSuccessRate" in result.utilityUsage).toBe(true);
    expect("heSuccessRate" in result.utilityUsage).toBe(true);
    expect("fireSuccessRate" in result.utilityUsage).toBe(true);
    expect(result.utilityUsage.flashSuccessRate).toBe(0.5);
    expect(result.utilityUsage.heSuccessRate).toBe(1);
    expect(result.utilityUsage.fireSuccessRate).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GetPlayerEconomyAnalyticsCommandHandler
// ---------------------------------------------------------------------------

describe("GetPlayerEconomyAnalyticsCommandHandler", () => {
  const baseCommand = {
    type: "get_player_economy_analytics" as const,
    steamId: "steam_xyz",
    startDate: makeDate(),
  };

  test("happy path: aggregateEconomyUsage returns data → returns { economyUsage }", async () => {
    const economyData = {
      _analyticsType: "economy" as const,
      roundsEco: 5,
      roundsForceBuy: 3,
      roundsFullBuy: 10,
      roundsPistol: 2,
      roundsEcoWon: 1,
    };
    const outbound = makeOutbound({
      matchRepository: {
        aggregateEconomyUsage: async () => economyData,
      },
    });
    const handler = getPlayerEconomyAnalyticsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ economyUsage: economyData });
  });

  test("passes correct steamId and startDate to aggregateEconomyUsage", async () => {
    let capturedSteamId: string | undefined;
    let capturedStartDate: Date | undefined;

    const outbound = makeOutbound({
      matchRepository: {
        aggregateEconomyUsage: async (steamId: string, startDate: Date) => {
          capturedSteamId = steamId;
          capturedStartDate = startDate;
          return { _analyticsType: "economy" as const };
        },
      },
    });
    const handler = getPlayerEconomyAnalyticsHandler(outbound);
    const startDate = new Date("2025-03-01T00:00:00Z");
    await handler({ ...baseCommand, steamId: "steam_specific", startDate });
    expect(capturedSteamId).toBe("steam_specific");
    expect(capturedStartDate).toEqual(startDate);
  });
});

// ---------------------------------------------------------------------------
// GetTotalPlayerStatsCommandHandler
// ---------------------------------------------------------------------------

describe("GetTotalPlayerStatsCommandHandler", () => {
  const baseCommand = {
    type: "get_total_player_stats" as const,
    steamId: "steam_player1",
  };

  test("happy path: stats found → returns { stats }", async () => {
    const statsData = {
      _analyticsType: "stats" as const,
      participantSteamId: "steam_player1",
      totalKills: 42,
      totalDeaths: 20,
    };
    const outbound = makeOutbound({
      matchRepository: {
        getTotalPlayerStats: async () => statsData,
      },
    });
    const handler = getTotalPlayerStatsHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ stats: statsData });
  });

  test("no stats found → throws DomainNotFoundError with message containing steamId", async () => {
    const outbound = makeOutbound({
      matchRepository: {
        getTotalPlayerStats: async () => null,
      },
    });
    const handler = getTotalPlayerStatsHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainNotFoundError);
    await expect(handler(baseCommand)).rejects.toThrow("steam_player1");
  });
});

// ---------------------------------------------------------------------------
// SeekNextAvailableMatchForAnalyticsAggregation
// ---------------------------------------------------------------------------

describe("SeekNextAvailableMatchForAnalyticsAggregation", () => {
  const makeMatches = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `match_${i + 1}` }));

  test("full page: 10 matches, step=10 → nextSeekIndex = seekIndex + 10", async () => {
    const outbound = makeOutbound({
      configuration: { matchesForAnalyticsSeekStep: 10 },
      matchRepository: {
        getMatchesPerStep: async () => makeMatches(10),
      },
    });
    const handler = seekNextAvailableMatchForAnalyticsAggregationHandler(outbound);
    const result = await handler({
      type: "seek_next_available_matches_for_analytics" as const,
      seekIndex: 0,
    });
    expect(result.nextSeekIndex).toBe(10);
    expect(result.matches).toHaveLength(10);
  });

  test("partial page: 3 matches, step=10 → nextSeekIndex = seekIndex + 10 (NOT reset to 0)", async () => {
    const outbound = makeOutbound({
      configuration: { matchesForAnalyticsSeekStep: 10 },
      matchRepository: {
        getMatchesPerStep: async () => makeMatches(3),
      },
    });
    const handler = seekNextAvailableMatchForAnalyticsAggregationHandler(outbound);
    const result = await handler({
      type: "seek_next_available_matches_for_analytics" as const,
      seekIndex: 20,
    });
    expect(result.nextSeekIndex).toBe(30);
    expect(result.matches).toHaveLength(3);
  });

  test("empty page: 0 matches, step=10 → nextSeekIndex = seekIndex + 10, matches = []", async () => {
    const outbound = makeOutbound({
      configuration: { matchesForAnalyticsSeekStep: 10 },
      matchRepository: {
        getMatchesPerStep: async () => [],
      },
    });
    const handler = seekNextAvailableMatchForAnalyticsAggregationHandler(outbound);
    const result = await handler({
      type: "seek_next_available_matches_for_analytics" as const,
      seekIndex: 50,
    });
    expect(result.nextSeekIndex).toBe(60);
    expect(result.matches).toEqual([]);
  });

  test("match IDs correctly extracted: returns array of m.id strings", async () => {
    const outbound = makeOutbound({
      configuration: { matchesForAnalyticsSeekStep: 5 },
      matchRepository: {
        getMatchesPerStep: async () => [
          { id: "abc", name: "irrelevant" },
          { id: "def", name: "also irrelevant" },
          { id: "ghi" },
        ],
      },
    });
    const handler = seekNextAvailableMatchForAnalyticsAggregationHandler(outbound);
    const result = await handler({
      type: "seek_next_available_matches_for_analytics" as const,
      seekIndex: 0,
    });
    expect(result.matches).toEqual(["abc", "def", "ghi"]);
  });

  test("seekIndex from non-zero with large step updates correctly", async () => {
    const outbound = makeOutbound({
      configuration: { matchesForAnalyticsSeekStep: 25 },
      matchRepository: {
        getMatchesPerStep: async () => makeMatches(25),
      },
    });
    const handler = seekNextAvailableMatchForAnalyticsAggregationHandler(outbound);
    const result = await handler({
      type: "seek_next_available_matches_for_analytics" as const,
      seekIndex: 75,
    });
    expect(result.nextSeekIndex).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// DownloadAndParseDemoCommandHandler
// ---------------------------------------------------------------------------

describe("DownloadAndParseDemoCommandHandler", () => {
  const baseCommand = {
    type: "download_and_parse_demo" as const,
    userId: "user_1",
    userSteamId: "steam_1",
    userSteamIdKey: "key_abc",
    lastKnownShareCode: "CSGO-AAAAA-BBBBB-CCCCC-DDDDD-EEEEE",
  };

  test("happy path: all steps succeed, not a duplicate → enqueues parse task, returns { url }", async () => {
    let enqueueCallCount = 0;
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT1" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: true,
          data: { url: "http://valve.com/demo.dem" },
        }),
        pingMatchUrl: async () => ({ isSuccess: true }),
      },
      matchRepository: {
        findByShareCode: async () => null,
      },
      queue: {
        enqueue: async () => {
          enqueueCallCount++;
        },
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ url: "http://valve.com/demo.dem" });
    expect(enqueueCallCount).toBe(1);
  });

  test("already parsed: findByShareCode finds existing match → returns { url: null }, enqueue NOT called", async () => {
    let enqueueCallCount = 0;
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT1" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: true,
          data: { url: "http://valve.com/demo.dem" },
        }),
        pingMatchUrl: async () => ({ isSuccess: true }),
      },
      matchRepository: {
        findByShareCode: async () => ({ id: "existing_match_id" }),
      },
      queue: {
        enqueue: async () => {
          enqueueCallCount++;
        },
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ url: null });
    expect(enqueueCallCount).toBe(0);
  });

  test("getNextAvailableShareCode fails (isSuccess=false) → throws the error from result.error", async () => {
    const shareCodeError = new Error("Share code not available");
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: false,
          data: { nextCode: "" },
          error: shareCodeError,
        }),
        getMatchUrlById: async () => ({ isSuccess: true, data: { url: "" } }),
        pingMatchUrl: async () => ({ isSuccess: true }),
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(shareCodeError);
  });

  test("getMatchUrlById fails (isSuccess=false) → throws result.error", async () => {
    const matchUrlError = new Error("Match URL not found");
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT1" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: false,
          data: { url: "" },
          error: matchUrlError,
        }),
        pingMatchUrl: async () => ({ isSuccess: true }),
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(matchUrlError);
  });

  test("pingMatchUrl fails → throws DomainUnavailableError with ping error message", async () => {
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT1" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: true,
          data: { url: "http://valve.com/demo.dem" },
        }),
        pingMatchUrl: async () => ({
          isSuccess: false,
          error: new Error("Connection timed out"),
        }),
      },
      matchRepository: {
        findByShareCode: async () => null,
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainUnavailableError);
    await expect(handler(baseCommand)).rejects.toThrow("Connection timed out");
  });

  test("pingMatchUrl fails with no error message → DomainUnavailableError('Demo not available for download')", async () => {
    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT1" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: true,
          data: { url: "http://valve.com/demo.dem" },
        }),
        pingMatchUrl: async () => ({
          isSuccess: false,
          error: undefined,
        }),
      },
      matchRepository: {
        findByShareCode: async () => null,
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    await expect(handler(baseCommand)).rejects.toThrow(DomainUnavailableError);
    await expect(handler(baseCommand)).rejects.toThrow("Demo not available for download");
  });

  test("updateKnownShareCode called with nextCode even when match already parsed", async () => {
    let capturedUserId: string | undefined;
    let capturedCode: string | undefined;

    const outbound = makeOutbound({
      gameCoordinatorRepository: {
        getNextAvailableShareCode: async () => ({
          isSuccess: true,
          data: { nextCode: "CSGO-NEXT-CODE" },
        }),
        getMatchUrlById: async () => ({
          isSuccess: true,
          data: { url: "http://valve.com/demo.dem" },
        }),
        pingMatchUrl: async () => ({ isSuccess: true }),
      },
      userRepository: {
        updateKnownShareCode: async (userId: string, code: string) => {
          capturedUserId = userId;
          capturedCode = code;
        },
      },
      matchRepository: {
        // Simulate already parsed match
        findByShareCode: async () => ({ id: "existing_match_id" }),
      },
    });
    const handler = downloadAndParseDemoCommandHandler(outbound);
    const result = await handler(baseCommand);
    expect(result).toEqual({ url: null });
    expect(capturedUserId).toBe("user_1");
    expect(capturedCode).toBe("CSGO-NEXT-CODE");
  });
});
