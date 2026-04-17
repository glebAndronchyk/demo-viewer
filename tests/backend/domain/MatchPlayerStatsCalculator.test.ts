import { describe, test, expect, beforeEach } from "bun:test";
import { MatchPlayerStatsCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerStatsCalculator.ts";
import { KillEvent } from "@demo-viewer/domain/src/entities/events";
import { PlayerHurtEvent } from "@demo-viewer/domain/src/entities/events";
import type { WeaponType } from "@demo-viewer/domain/src/entities/WeaponType.ts";
import type { PlayerState } from "@demo-viewer/domain/src/entities/DemoChunkEntity.ts";
import type { RoundInfo } from "@demo-viewer/domain/src/entities/MatchEntity.ts";
import { MockMatchOutboundPort } from "./mocks/MockMatchOutboundPort.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKill(isHeadshot = false): KillEvent {
  return new KillEvent(
    "killer1",
    "Killer",
    "victim1",
    "Victim",
    null,
    null,
    "AK-47",
    isHeadshot,
    0,
  );
}

function makeHurt(
  healthDamage: number,
  armorDamage: number,
  weapon: WeaponType = "AK-47",
): PlayerHurtEvent {
  return new PlayerHurtEvent(
    "victim1",
    "Victim",
    "attacker1",
    "Attacker",
    healthDamage,
    armorDamage,
    weapon,
    "Chest",
  );
}

function makeRound(): RoundInfo {
  return { roundNumber: 1 } as RoundInfo;
}

const defaultPlayerState: PlayerState = {
  steamId64: "attacker1",
  name: "Attacker",
  userId: 1,
  team: "CT",
  position: { x: 0, y: 0, z: 0 },
  viewDirection: { x: 0, y: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  hp: 100,
  armor: 100,
  hasHelmet: false,
  hasDefuseKit: false,
  money: 0,
  currentEquipment: {} as any,
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
  score: 42,
  mvps: 3,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const MATCH_ID = "match-1";
const PLAYER_STEAM_ID = "attacker1";

describe("MatchPlayerStatsCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchPlayerStatsCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    mock.playerStateResult = { ...defaultPlayerState };
    calc = new MatchPlayerStatsCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
  });

  // -------------------------------------------------------------------------
  describe("getTotalKills", () => {
    test("returns 0 when there are no kill events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getTotalKills()).toBe(0);
    });

    test("returns correct kill count", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(), makeKill(), makeKill()],
        [],
        [],
        [],
      ];
      expect(await calc.getTotalKills()).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalDeaths", () => {
    test("returns 0 when there are no death events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getTotalDeaths()).toBe(0);
    });

    test("returns correct death count", async () => {
      mock.aggregatedEventsResult = [[], [makeKill(), makeKill()], [], []];
      expect(await calc.getTotalDeaths()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalAssists", () => {
    test("returns 0 when there are no assist events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getTotalAssists()).toBe(0);
    });

    test("returns correct assist count", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [makeKill(), makeKill(), makeKill(), makeKill()],
        [],
      ];
      expect(await calc.getTotalAssists()).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalHs", () => {
    test("returns 0 when there are no kills", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getTotalHs()).toBe(0);
    });

    test("returns 1.0 when all kills are headshots", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(true), makeKill(true)],
        [],
        [],
        [],
      ];
      expect(await calc.getTotalHs()).toBe(1);
    });

    test("returns 0 when no kills are headshots", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(false), makeKill(false)],
        [],
        [],
        [],
      ];
      expect(await calc.getTotalHs()).toBe(0);
    });

    test("returns correct ratio for mixed headshots", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(true), makeKill(true), makeKill(false), makeKill(false)],
        [],
        [],
        [],
      ];
      expect(await calc.getTotalHs()).toBe(0.5);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalAdr", () => {
    test("returns 0 when there are no rounds played", async () => {
      mock.aggregatedEventsResult = [[], [], [], [makeHurt(80, 20)]];
      mock.roundsResult = [];
      expect(await calc.getTotalAdr()).toBe(0);
    });

    test("returns 0 when there are no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      mock.roundsResult = [makeRound(), makeRound()];
      expect(await calc.getTotalAdr()).toBe(0);
    });

    test("sums only health damage", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [],
        [makeHurt(50, 10), makeHurt(30, 10)],
      ];
      mock.roundsResult = [makeRound(), makeRound()];
      expect(await calc.getTotalAdr()).toBe(40);
    });

    test("counts only health damage, not armor", async () => {
      mock.aggregatedEventsResult = [[], [], [], [makeHurt(0, 100)]];
      mock.roundsResult = [makeRound()];
      expect(await calc.getTotalAdr()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalUtilityDamage", () => {
    test("returns 0 when there are no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getTotalUtilityDamage()).toBe(0);
    });

    test("excludes non-utility weapon damage", async () => {
      mock.aggregatedEventsResult = [[], [], [], [makeHurt(100, 0, "AK-47")]];
      expect(await calc.getTotalUtilityDamage()).toBe(0);
    });

    test("counts HE Grenade damage", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [],
        [makeHurt(80, 0, "HE Grenade")],
      ];
      expect(await calc.getTotalUtilityDamage()).toBe(80);
    });

    test("counts Molotov damage", async () => {
      mock.aggregatedEventsResult = [[], [], [], [makeHurt(40, 5, "Molotov")]];
      expect(await calc.getTotalUtilityDamage()).toBe(45);
    });

    test("counts all grenade types and sums health + armor damage", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [],
        [
          makeHurt(50, 10, "HE Grenade"),
          makeHurt(30, 0, "Molotov"),
          makeHurt(100, 0, "AK-47"), // should be excluded
        ],
      ];
      expect(await calc.getTotalUtilityDamage()).toBe(90);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalKpr", () => {
    test("returns 0 when there are no rounds", async () => {
      mock.aggregatedEventsResult = [[makeKill(), makeKill()], [], [], []];
      mock.roundsResult = [];
      expect(await calc.getTotalKpr()).toBe(0);
    });

    test("returns correct kills per round", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(), makeKill(), makeKill()],
        [],
        [],
        [],
      ];
      mock.roundsResult = [makeRound(), makeRound()];
      expect(await calc.getTotalKpr()).toBe(1.5);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalApr", () => {
    test("returns 0 when there are no rounds", async () => {
      mock.aggregatedEventsResult = [[], [], [makeKill()], []];
      mock.roundsResult = [];
      expect(await calc.getTotalApr()).toBe(0);
    });

    test("returns correct assists per round", async () => {
      mock.aggregatedEventsResult = [[], [], [makeKill(), makeKill()], []];
      mock.roundsResult = [makeRound(), makeRound()];
      expect(await calc.getTotalApr()).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalScore", () => {
    test("returns score from player final state", async () => {
      mock.playerStateResult = { ...defaultPlayerState, score: 99 };
      expect(await calc.getTotalScore()).toBe(99);
    });

    test("returns 0 score when player has no score", async () => {
      mock.playerStateResult = { ...defaultPlayerState, score: 0 };
      expect(await calc.getTotalScore()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalMvps", () => {
    test("returns mvps from player final state", async () => {
      mock.playerStateResult = { ...defaultPlayerState, mvps: 5 };
      expect(await calc.getTotalMvps()).toBe(5);
    });

    test("returns 0 mvps when player has none", async () => {
      mock.playerStateResult = { ...defaultPlayerState, mvps: 0 };
      expect(await calc.getTotalMvps()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalRoundsPlayed", () => {
    test("returns 0 when no rounds played", async () => {
      mock.roundsResult = [];
      expect(await calc.getTotalRoundsPlayed()).toBe(0);
    });

    test("returns correct round count", async () => {
      mock.roundsResult = [makeRound(), makeRound(), makeRound()];
      expect(await calc.getTotalRoundsPlayed()).toBe(3);
    });

    test("returns same value on repeated calls (caching)", async () => {
      mock.roundsResult = [makeRound(), makeRound()];
      const first = await calc.getTotalRoundsPlayed();
      const second = await calc.getTotalRoundsPlayed();
      expect(first).toBe(second);
    });
  });

  // -------------------------------------------------------------------------
  describe("shared kill query caching", () => {
    test("getTotalKills and getTotalDeaths return consistent values from shared query", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(), makeKill()], // kills
        [makeKill(), makeKill(), makeKill()], // deaths
        [],
        [],
      ];
      const kills = await calc.getTotalKills();
      const deaths = await calc.getTotalDeaths();
      expect(kills).toBe(2);
      expect(deaths).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns a complete PlayerStatsEntity with correct matchId and participantSteamId", async () => {
      mock.aggregatedEventsResult = [
        [makeKill(true), makeKill(false)], // kills: 2 (1 HS)
        [makeKill()], // deaths: 1
        [makeKill()], // assists: 1
        [makeHurt(60, 20, "AK-47"), makeHurt(40, 0, "HE Grenade")], // hurt events
      ];
      mock.roundsResult = [makeRound(), makeRound()]; // 2 rounds
      mock.playerStateResult = { ...defaultPlayerState, score: 10, mvps: 2 };

      const result = await calc.calculate();

      expect(result.matchId).toBe(MATCH_ID);
      expect(result.participantSteamId).toBe(PLAYER_STEAM_ID);
      expect(result.totalKills).toBe(2);
      expect(result.totalDeaths).toBe(1);
      expect(result.totalAssists).toBe(1);
      expect(result.totalHs).toBe(0.5);
      expect(result.totalAdr).toBe(50); // (60+40) = 100 / 2 rounds
      expect(result.totalUtilityDamage).toBe(40); // only HE Grenade
      expect(result.totalKpr).toBe(1); // 2 kills / 2 rounds
      expect(result.totalApr).toBe(0.5); // 1 assist / 2 rounds
      expect(result.totalRoundsPlayed).toBe(2);
      expect(result.totalScore).toBe(10);
      expect(result.totalMvps).toBe(2);
    });

    test("returns zeroed stats when there are no events or rounds", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      mock.roundsResult = [];
      mock.playerStateResult = { ...defaultPlayerState, score: 0, mvps: 0 };

      const result = await calc.calculate();

      expect(result.totalKills).toBe(0);
      expect(result.totalDeaths).toBe(0);
      expect(result.totalAssists).toBe(0);
      expect(result.totalHs).toBe(0);
      expect(result.totalAdr).toBe(0);
      expect(result.totalUtilityDamage).toBe(0);
      expect(result.totalKpr).toBe(0);
      expect(result.totalApr).toBe(0);
      expect(result.totalRoundsPlayed).toBe(0);
      expect(result.totalScore).toBe(0);
      expect(result.totalMvps).toBe(0);
    });
  });
});
