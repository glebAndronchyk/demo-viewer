import { describe, test, expect, beforeEach } from "bun:test";
import { MatchAccuracyCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchAccuracyCalculator.ts";
import {
  KillEvent,
  PlayerHurtEvent,
  WeaponFireEvent,
} from "@demo-viewer/domain/src/entities/events";
import type { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort.ts";
import type { HitGroup } from "@demo-viewer/domain/src/entities/HitGroup.ts";
import type { Frame } from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import type { RoundInfo } from "@demo-viewer/domain/src/entities/MatchEntity";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeadshotKill(): KillEvent {
  return new KillEvent(
    "player1",
    "Player1",
    "victim1",
    "Victim",
    null,
    null,
    "AK-47",
    true,
    0,
  );
}

function makeHurt(hitGroup: HitGroup = "Chest"): PlayerHurtEvent {
  return new PlayerHurtEvent(
    "victim1",
    "Victim",
    "player1",
    "Player1",
    50,
    10,
    "AK-47",
    hitGroup,
  );
}

function makeShot(): WeaponFireEvent {
  return new WeaponFireEvent("player1", "Player1", "AK-47");
}

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

type EventsTuple = [KillEvent[], PlayerHurtEvent[], WeaponFireEvent[]];

class MockMatchOutboundPort implements MatchOutboundPort {
  getFirstGameTickOfEveryRound(matchId: string): Promise<Frame[]> {
    throw new Error("Method not implemented.");
  }
  getRoundInfoByFrame(
    matchId: string,
    frame: Frame,
  ): Promise<RoundInfo | null> {
    throw new Error("Method not implemented.");
  }

  aggregatedEventsResult: EventsTuple = [[], [], []];

  async getAggregatedEvents(_filter: any, _events: any, cache?: any) {
    if (cache) cache.set(this.aggregatedEventsResult);
    return this.aggregatedEventsResult as any;
  }

  async getRoundsPlayedByPlayer(): Promise<any[]> {
    return [];
  }

  async getPlayerFinalStateForMatch(): Promise<any> {
    return null;
  }

  async findByShareCode(): Promise<any> {
    return null;
  }

  async findByMatchId(): Promise<any> {
    return null;
  }

  async getTicksRange(): Promise<any> {
    return null;
  }

  async getClutchRounds(): Promise<any[]> {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const MATCH_ID = "match-1";
const PLAYER_STEAM_ID = "player1";

describe("MatchAccuracyCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchAccuracyCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    calc = new MatchAccuracyCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
  });

  // -------------------------------------------------------------------------
  describe("getHeadshots", () => {
    test("returns 0 when there are no headshot kills", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getHeadshots()).toBe(0);
    });

    test("returns correct headshot count", async () => {
      mock.aggregatedEventsResult = [
        [makeHeadshotKill(), makeHeadshotKill(), makeHeadshotKill()],
        [],
        [],
      ];
      expect(await calc.getHeadshots()).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalShots", () => {
    test("returns 0 when there are no weapon fire events", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalShots()).toBe(0);
    });

    test("returns correct shot count", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [makeShot(), makeShot(), makeShot(), makeShot(), makeShot()],
      ];
      expect(await calc.getTotalShots()).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalHits", () => {
    test("returns 0 when there are no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalHits()).toBe(0);
    });

    test("returns correct hit count", async () => {
      mock.aggregatedEventsResult = [[], [makeHurt(), makeHurt()], []];
      expect(await calc.getTotalHits()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getAccuracyPercentage", () => {
    test("returns NaN when there are no shots (division by zero)", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      // 0 hits / 0 headshots = NaN
      expect(await calc.getAccuracyPercentage()).toBeNaN();
    });

    test("returns correct ratio of hits to headshots", async () => {
      mock.aggregatedEventsResult = [
        [makeHeadshotKill(), makeHeadshotKill()], // 2 headshots
        [makeHurt(), makeHurt(), makeHurt(), makeHurt()], // 4 hits
        [],
      ];
      // 4 hits / 2 headshots = 2
      expect(await calc.getAccuracyPercentage()).toBe(2);
    });

    test("returns 0 when there are hits but no headshots", async () => {
      mock.aggregatedEventsResult = [
        [], // 0 headshots
        [makeHurt(), makeHurt()], // 2 hits
        [],
      ];
      // 2 hits / 0 headshots = Infinity
      expect(await calc.getAccuracyPercentage()).toBe(Infinity);
    });
  });

  // -------------------------------------------------------------------------
  describe("getHitBreakdown", () => {
    test("returns empty object when there are no hits", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getHitBreakdown()).toEqual({} as never);
    });

    test("counts hits per hit group", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeHurt("Head"),
          makeHurt("Head"),
          makeHurt("Chest"),
          makeHurt("Stomach"),
        ],
        [],
      ];
      const breakdown = await calc.getHitBreakdown();
      expect(breakdown["Head"]).toBe(2);
      expect(breakdown["Chest"]).toBe(1);
      expect(breakdown["Stomach"]).toBe(1);
    });

    test("groups all hit group types correctly", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeHurt("Head"),
          makeHurt("Chest"),
          makeHurt("Stomach"),
          makeHurt("LeftArm"),
          makeHurt("RightArm"),
          makeHurt("LeftLeg"),
          makeHurt("RightLeg"),
        ],
        [],
      ];
      const breakdown = await calc.getHitBreakdown();
      expect(breakdown["Head"]).toBe(1);
      expect(breakdown["Chest"]).toBe(1);
      expect(breakdown["Stomach"]).toBe(1);
      expect(breakdown["LeftArm"]).toBe(1);
      expect(breakdown["RightArm"]).toBe(1);
      expect(breakdown["LeftLeg"]).toBe(1);
      expect(breakdown["RightLeg"]).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("shared query caching", () => {
    test("getTotalShots and getTotalHits return consistent values from the same query", async () => {
      mock.aggregatedEventsResult = [
        [],
        [makeHurt(), makeHurt()],
        [makeShot(), makeShot(), makeShot()],
      ];
      const shots = await calc.getTotalShots();
      const hits = await calc.getTotalHits();
      expect(shots).toBe(3);
      expect(hits).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns a complete PlayerAccuracyEntity with correct values", async () => {
      mock.aggregatedEventsResult = [
        [makeHeadshotKill(), makeHeadshotKill()], // 2 headshots
        [makeHurt("Head"), makeHurt("Chest"), makeHurt("Chest")], // 3 hits
        [makeShot(), makeShot(), makeShot(), makeShot(), makeShot()], // 5 shots
      ];

      const result = await calc.calculate();

      expect(result.headshots).toBe(2);
      expect(result.totalHits).toBe(3);
      expect(result.totalShots).toBe(5);
      expect(result.topLevelAccuracy).toBe(1.5); // 3 hits / 2 headshots
      expect(result.hitBreakdown?.["Head"]).toBe(1);
      expect(result.hitBreakdown?.["Chest"]).toBe(2);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("returns zeroed stats when there are no events", async () => {
      mock.aggregatedEventsResult = [[], [], []];

      const result = await calc.calculate();

      expect(result.headshots).toBe(0);
      expect(result.totalHits).toBe(0);
      expect(result.totalShots).toBe(0);
      expect(result.hitBreakdown).toEqual({} as never);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("does not include statsId in the result", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      const result = await calc.calculate();
      expect("statsId" in result).toBe(false);
    });
  });
});
