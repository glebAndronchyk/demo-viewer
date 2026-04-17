import { describe, test, expect, beforeEach } from "bun:test";
import { MatchPlayerEconomyCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerEconomyCalculator.ts";
import { ItemPickupEvent } from "@demo-viewer/domain/src/entities/events/ItemPickupEvent.ts";
import { ItemDropEvent } from "@demo-viewer/domain/src/entities/events/ItemDropEvent.ts";
import { ItemRefundEvent } from "@demo-viewer/domain/src/entities/events/ItemRefundEvent.ts";
import type {
  Frame,
  PlayerState,
  Equipment,
} from "@demo-viewer/domain/src/entities/DemoChunkEntity.ts";
import type { RoundInfo } from "@demo-viewer/domain/src/entities/MatchEntity.ts";
import { MockMatchOutboundPort } from "./mocks/MockMatchOutboundPort.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MATCH_ID = "match-1";
const PLAYER_STEAM_ID = "player-steam-1";

function makeEquipment(
  weapons: string[] = [],
  grenades: string[] = [],
): Equipment {
  return { activeWeapon: weapons[0] ?? "", weapons, grenades };
}

function makePlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    steamId64: PLAYER_STEAM_ID,
    name: "Player",
    userId: 1,
    team: "CT",
    position: { x: 0, y: 0, z: 0 },
    viewDirection: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    hp: 100,
    armor: 100,
    hasHelmet: false,
    hasDefuseKit: false,
    money: 800,
    currentEquipment: makeEquipment(),
    isAlive: true,
    isBot: false,
    isConnected: true,
    isDucking: false,
    isDefusing: false,
    isPlanting: false,
    isReloading: false,
    isScoped: false,
    isWalking: false,
    flashDuration: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    score: 0,
    mvps: 0,
    ...overrides,
  };
}

function makeFrame(
  gameTick: number,
  playerOverrides: Partial<PlayerState> = {},
): Frame {
  return {
    demoTick: gameTick,
    gameTick,
    timestamp: gameTick * 100,
    playerStates: [makePlayerState(playerOverrides)],
    gameState: {
      roundNumber: 1,
      phase: "live",
      ctScore: 0,
      tScore: 0,
      timeRemaining: 115,
      bombPlanted: false,
      bombTimeRemaining: 0,
    },
    events: [],
  };
}

function makeRoundInfo(overrides: Partial<RoundInfo> = {}): RoundInfo {
  return {
    roundNumber: 1,
    winner: "CT",
    startDemoTick: 0,
    endDemoTick: 1000,
    startGameTick: 0,
    endGameTick: 1000,
    ...overrides,
  };
}

// tick, weapon, entityId, isBought
function makeBuyEvent(
  gameTick: number,
  weapon: string,
  entityId: string | null = null,
): ItemPickupEvent {
  return new ItemPickupEvent(
    PLAYER_STEAM_ID,
    "Player",
    weapon as any,
    true,
    entityId,
    gameTick,
    gameTick,
  );
}

function makeDropEvent(
  gameTick: number,
  entityId: string | null = null,
): ItemDropEvent {
  return new ItemDropEvent(
    PLAYER_STEAM_ID,
    "Player",
    "AK-47",
    entityId,
    gameTick,
    gameTick,
  );
}

function makeRefundEvent(
  gameTick: number,
  entityId: string | null = null,
): ItemRefundEvent {
  return new ItemRefundEvent(
    PLAYER_STEAM_ID,
    "Player",
    "AK-47",
    entityId,
    gameTick,
    gameTick,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MatchPlayerEconomyCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchPlayerEconomyCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    mock.playerStateResult = makePlayerState();
    calc = new MatchPlayerEconomyCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
  });

  // -------------------------------------------------------------------------
  describe("isRoundEcoBuy", () => {
    test("returns false when player not in frame", () => {
      const frame = makeFrame(100, { steamId64: "other-player" });
      expect(calc.isRoundEcoBuy(frame, [], [], [])).toBe(false);
    });

    test("returns true when equipment value is below 750 (empty start, no buys)", () => {
      // Player has no equipment, no buys → totalEquipmentValue = 0
      const frame = makeFrame(100, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      expect(calc.isRoundEcoBuy(frame, [], [], [])).toBe(true);
    });

    test("returns true when equipment value is exactly below 750 (cheap pistol)", () => {
      // P250 = 300 → eco
      const frame = makeFrame(100, {
        money: 500,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "P250", "eid-1")];
      expect(calc.isRoundEcoBuy(frame, buys, [], [])).toBe(true);
    });

    test("returns false when equipment value is 750 or above (full pistol + util)", () => {
      // Desert Eagle (700) + HE Grenade (300) = 1000 → not eco
      const frame = makeFrame(100, {
        money: 200,
        currentEquipment: makeEquipment(),
      });
      const buys = [
        makeBuyEvent(105, "Desert Eagle", "eid-1"),
        makeBuyEvent(106, "HE Grenade", "eid-2"),
      ];
      expect(calc.isRoundEcoBuy(frame, buys, [], [])).toBe(false);
    });

    test("excludes dropped items from equipment value", () => {
      // AK-47 (2700) bought then dropped → effectively 0 equipment value → eco
      const frame = makeFrame(100, {
        money: 3000,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "AK-47", "eid-1")];
      const drops = [makeDropEvent(106, "eid-1")];
      expect(calc.isRoundEcoBuy(frame, buys, drops, [])).toBe(true);
    });

    test("excludes refunded items from equipment value", () => {
      // AK-47 bought then refunded → equipment value = 0 → eco
      const frame = makeFrame(100, {
        money: 3000,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "AK-47", "eid-1")];
      const refunds = [makeRefundEvent(106, "eid-1")];
      expect(calc.isRoundEcoBuy(frame, buys, [], refunds)).toBe(true);
    });

    test("includes start equipment value in calculation", () => {
      // Player starts with AK-47 (2700) in inventory → not eco
      const frame = makeFrame(100, {
        money: 1000,
        currentEquipment: makeEquipment(["AK-47"]),
      });
      expect(calc.isRoundEcoBuy(frame, [], [], [])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe("isRoundFullBuy", () => {
    test("returns false when player not in frame", () => {
      const frame = makeFrame(100, { steamId64: "other-player" });
      expect(calc.isRoundFullBuy(frame, [], [], [])).toBe(false);
    });

    test("returns false when equipment value is at or below 3500", () => {
      // AK-47 (2700) + Kevlar+Helmet (1000) = 3700 → full buy
      const frame = makeFrame(100, {
        money: 300,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "AK-47", "eid-1")];
      expect(calc.isRoundFullBuy(frame, buys, [], [])).toBe(false);
    });

    test("returns true when equipment value exceeds 3500", () => {
      // AK-47 (2700) + Kevlar+Helmet (1000) = 3700 → full buy
      const frame = makeFrame(100, {
        money: 300,
        currentEquipment: makeEquipment(),
      });
      const buys = [
        makeBuyEvent(105, "AK-47", "eid-1"),
        makeBuyEvent(106, "Kevlar + Helmet", "eid-2"),
      ];
      expect(calc.isRoundFullBuy(frame, buys, [], [])).toBe(true);
    });

    test("returns true when start equipment already exceeds 3500", () => {
      // AWP (4750) in start inventory → full buy
      const frame = makeFrame(100, {
        money: 0,
        currentEquipment: makeEquipment(["AWP"]),
      });
      expect(calc.isRoundFullBuy(frame, [], [], [])).toBe(true);
    });

    test("dropped items reduce equipment value below threshold", () => {
      // AK-47 + Kevlar+Helmet bought but AK dropped → 1000 only → not full buy
      const frame = makeFrame(100, {
        money: 300,
        currentEquipment: makeEquipment(),
      });
      const buys = [
        makeBuyEvent(105, "AK-47", "eid-1"),
        makeBuyEvent(106, "Kevlar + Helmet", "eid-2"),
      ];
      const drops = [makeDropEvent(107, "eid-1")];
      expect(calc.isRoundFullBuy(frame, buys, drops, [])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe("isRoundForceBuy", () => {
    test("returns false when player not in frame", () => {
      const frame = makeFrame(100, { steamId64: "other-player" });
      expect(calc.isRoundForceBuy(frame, [], [], [])).toBe(false);
    });

    test("returns false for eco round (< 750 equipment value)", () => {
      // P250 (300), money = 800, expenses/startMoney = 300/800 = 0.375 < 0.75
      const frame = makeFrame(100, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "P250", "eid-1")];
      expect(calc.isRoundForceBuy(frame, buys, [], [])).toBe(false);
    });

    test("returns false for full buy (> 3500 equipment value)", () => {
      const frame = makeFrame(100, {
        money: 4000,
        currentEquipment: makeEquipment(),
      });
      const buys = [
        makeBuyEvent(105, "AK-47", "eid-1"),
        makeBuyEvent(106, "Kevlar + Helmet", "eid-2"),
      ];
      expect(calc.isRoundForceBuy(frame, buys, [], [])).toBe(false);
    });

    test("returns true when expenses exceed 75% of start money and it is not eco/full buy", () => {
      // MAC-10 (1050) + some util, money = 1500, not eco (>750), not full buy (<3500)
      // expenses/startMoney = 1050 / 1400 ≈ 0.75 → exactly 0.75 (>= passes)
      const frame = makeFrame(100, {
        money: 1400,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "MAC-10", "eid-1")]; // 1050 spent
      expect(calc.isRoundForceBuy(frame, buys, [], [])).toBe(true);
    });

    test("returns false when expenses are below 75% of start money (mid buy)", () => {
      // P250 (300) with 2000 money → 300/2000 = 0.15 → not force
      const frame = makeFrame(100, {
        money: 2000,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "P250", "eid-1")];
      expect(calc.isRoundForceBuy(frame, buys, [], [])).toBe(false);
    });

    test("refunded items are excluded from expenses calculation", () => {
      // AK-47 (2700) bought then refunded → effective expenses = 0 → not force
      const frame = makeFrame(100, {
        money: 3000,
        currentEquipment: makeEquipment(),
      });
      const buys = [makeBuyEvent(105, "AK-47", "eid-1")];
      const refunds = [makeRefundEvent(106, "eid-1")];
      expect(calc.isRoundForceBuy(frame, buys, [], refunds)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe("getEcoBuyRoundsFrames", () => {
    test("returns empty array when there are no rounds", async () => {
      mock.startFrames = [];
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getEcoBuyRoundsFrames()).toEqual([]);
    });

    test("returns frames where player eco-bought", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 4000,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];
      // Frame 1 tick 100-1999: eco (P250 only), Frame 2 tick 2000+: full buy (AK-47 + Kevlar+Helmet)
      mock.aggregatedEventsResult = [
        [
          makeBuyEvent(105, "P250", "eid-1"),
          makeBuyEvent(2005, "AK-47", "eid-2"),
          makeBuyEvent(2006, "Kevlar + Helmet", "eid-3"),
        ],
        [],
        [],
      ];
      const result = await calc.getEcoBuyRoundsFrames();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(frame1);
    });

    test("returns multiple eco frames when applicable", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 600,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];
      // Both rounds have no buys → both eco
      mock.aggregatedEventsResult = [[], [], []];
      const result = await calc.getEcoBuyRoundsFrames();
      expect(result).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getForceRoundsFrames", () => {
    test("returns empty array when there are no rounds", async () => {
      mock.startFrames = [];
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getForceRoundsFrames()).toEqual([]);
    });

    test("returns frames classified as force buy", async () => {
      // money = 1400, MAC-10 (1050) → 1050/1400 = 0.75, not eco, not full buy
      const frame1 = makeFrame(100, {
        money: 1400,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];
      mock.aggregatedEventsResult = [
        [makeBuyEvent(105, "MAC-10", "eid-1")],
        [],
        [],
      ];
      const result = await calc.getForceRoundsFrames();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(frame1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getFullBuyRoundsFrames", () => {
    test("returns empty array when there are no rounds", async () => {
      mock.startFrames = [];
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getFullBuyRoundsFrames()).toEqual([]);
    });

    test("returns frames classified as full buy", async () => {
      const frame1 = makeFrame(100, {
        money: 4000,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];
      mock.aggregatedEventsResult = [
        [
          makeBuyEvent(105, "AK-47", "eid-1"), // 2700
          makeBuyEvent(106, "Kevlar + Helmet", "eid-2"), // 1000
        ],
        [],
        [],
      ];
      const result = await calc.getFullBuyRoundsFrames();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(frame1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getEcoWonRoundsFrames", () => {
    test("returns empty array when no eco rounds", async () => {
      mock.startFrames = [];
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getEcoWonRoundsFrames()).toEqual([]);
    });

    test("returns eco frames where the player's team won", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1];
      mock.aggregatedEventsResult = [[], [], []];
      mock.roundInfoMap.set(frame1, makeRoundInfo({ winner: "CT" }));

      const result = await calc.getEcoWonRoundsFrames();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(frame1);
    });

    test("excludes eco frames where the player's team lost", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1];
      mock.aggregatedEventsResult = [[], [], []];
      mock.roundInfoMap.set(frame1, makeRoundInfo({ winner: "T" }));

      const result = await calc.getEcoWonRoundsFrames();
      expect(result).toHaveLength(0);
    });

    test("excludes eco frames where roundInfo is null", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1];
      mock.aggregatedEventsResult = [[], [], []];
      mock.roundInfoMap.set(frame1, null);

      const result = await calc.getEcoWonRoundsFrames();
      expect(result).toHaveLength(0);
    });

    test("returns only winning eco frames when some are won and some lost", async () => {
      const frame1 = makeFrame(100, {
        money: 800,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 500,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];
      mock.aggregatedEventsResult = [[], [], []];
      mock.roundInfoMap.set(frame1, makeRoundInfo({ winner: "CT" }));
      mock.roundInfoMap.set(frame2, makeRoundInfo({ winner: "T" }));

      const result = await calc.getEcoWonRoundsFrames();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(frame1);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns zeroed counts when there are no rounds", async () => {
      mock.startFrames = [];
      mock.aggregatedEventsResult = [[], [], []];

      const result = await calc.calculate();

      expect(result.roundsEco).toBe(0);
      expect(result.roundsForceBuy).toBe(0);
      expect(result.roundsFullBuy).toBe(0);
      expect(result.roundsEcoWon).toBe(0);
    });

    test("correctly counts eco, force, full buy, and eco won across rounds", async () => {
      // Round 1 (tick 100): eco, team CT wins
      const frame1 = makeFrame(100, {
        money: 800,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      // Round 2 (tick 2000): force buy
      const frame2 = makeFrame(2000, {
        money: 1400,
        team: "CT",
        currentEquipment: makeEquipment(),
      });
      // Round 3 (tick 4000): full buy
      const frame3 = makeFrame(4000, {
        money: 5000,
        team: "CT",
        currentEquipment: makeEquipment(),
      });

      mock.startFrames = [frame1, frame2, frame3];
      mock.aggregatedEventsResult = [
        [
          // Round 2: MAC-10 force buy
          makeBuyEvent(2005, "MAC-10", "eid-1"),
          // Round 3: full buy
          makeBuyEvent(4005, "AK-47", "eid-2"),
          makeBuyEvent(4006, "Kevlar + Helmet", "eid-3"),
        ],
        [],
        [],
      ];
      mock.roundInfoMap.set(frame1, makeRoundInfo({ winner: "CT" }));
      mock.roundInfoMap.set(frame2, makeRoundInfo({ winner: "T" }));
      mock.roundInfoMap.set(frame3, makeRoundInfo({ winner: "CT" }));

      const result = await calc.calculate();

      expect(result.roundsEco).toBe(1);
      expect(result.roundsForceBuy).toBe(1);
      expect(result.roundsFullBuy).toBe(1);
      expect(result.roundsEcoWon).toBe(1);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("does not count eco as force or full buy", async () => {
      const frame = makeFrame(100, {
        money: 800,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame];
      mock.aggregatedEventsResult = [[], [], []]; // no buys → eco

      const result = await calc.calculate();

      expect(result.roundsEco).toBe(1);
      expect(result.roundsForceBuy).toBe(0);
      expect(result.roundsFullBuy).toBe(0);
    });

    test("player absent from frames does not count any category", async () => {
      // Player not in frame
      const frame = makeFrame(100, { steamId64: "other-player" });
      mock.startFrames = [frame];
      mock.aggregatedEventsResult = [[], [], []];

      const result = await calc.calculate();

      expect(result.roundsEco).toBe(0);
      expect(result.roundsForceBuy).toBe(0);
      expect(result.roundsFullBuy).toBe(0);
      expect(result.roundsEcoWon).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("event partitioning by round", () => {
    test("buy events are assigned to the correct round based on gameTick", async () => {
      // Round 1: ticks 100–1999, Round 2: ticks 2000+
      const frame1 = makeFrame(100, {
        money: 5000,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 5000,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];

      // Full buy in round 1, full buy in round 2 (both separate)
      mock.aggregatedEventsResult = [
        [
          makeBuyEvent(105, "AK-47", "eid-1"),
          makeBuyEvent(106, "Kevlar + Helmet", "eid-2"),
          makeBuyEvent(2005, "AK-47", "eid-3"),
          makeBuyEvent(2006, "Kevlar + Helmet", "eid-4"),
        ],
        [],
        [],
      ];

      const result = await calc.getFullBuyRoundsFrames();
      expect(result).toHaveLength(2);
    });

    test("buy event at exactly a round start tick is counted in that round", async () => {
      const frame1 = makeFrame(100, {
        money: 5000,
        currentEquipment: makeEquipment(),
      });
      const frame2 = makeFrame(2000, {
        money: 5000,
        currentEquipment: makeEquipment(),
      });
      mock.startFrames = [frame1, frame2];

      // Buy at exactly tick 2000 belongs to round 2
      mock.aggregatedEventsResult = [
        [
          makeBuyEvent(2000, "AK-47", "eid-1"),
          makeBuyEvent(2001, "Kevlar + Helmet", "eid-2"),
        ],
        [],
        [],
      ];

      const fullBuyFrames = await calc.getFullBuyRoundsFrames();
      expect(fullBuyFrames).toHaveLength(1);
      expect(fullBuyFrames[0]).toBe(frame2);
    });
  });

  // -------------------------------------------------------------------------
  describe("caching behaviour", () => {
    test("getFirstGameTickOfEveryRound is called only once across multiple public methods (dbCache)", async () => {
      let callCount = 0;
      const original = mock.getFirstGameTickOfEveryRound.bind(mock);
      mock.getFirstGameTickOfEveryRound = async (...args: any[]) => {
        callCount++;
        return original(...args);
      };

      mock.startFrames = [
        makeFrame(100, { money: 800, currentEquipment: makeEquipment() }),
      ];
      mock.aggregatedEventsResult = [[], [], []];

      await calc.getEcoBuyRoundsFrames();
      await calc.getForceRoundsFrames();
      await calc.getFullBuyRoundsFrames();

      // startFrames are cached in dbCache after the first sharedQuery call
      expect(callCount).toBe(1);
    });

    test("getAggregatedEvents receives a cache object with get/set for external caching", async () => {
      let receivedCache: any;
      const original = mock.getAggregatedEvents.bind(mock);
      mock.getAggregatedEvents = async (
        filter: any,
        events: any,
        cache: any,
      ) => {
        receivedCache = cache;
        return original(filter, events, cache);
      };

      mock.startFrames = [
        makeFrame(100, { money: 800, currentEquipment: makeEquipment() }),
      ];
      mock.aggregatedEventsResult = [[], [], []];

      await calc.getEcoBuyRoundsFrames();

      expect(receivedCache).toBeDefined();
      expect(typeof receivedCache.get).toBe("function");
      expect(typeof receivedCache.set).toBe("function");
    });
  });
});
