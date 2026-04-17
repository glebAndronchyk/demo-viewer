import { describe, test, expect, beforeEach } from "bun:test";
import { MatchPlayerWeaponStatsCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerWeaponStatsCalculator.ts";
import {
  KillEvent,
  PlayerHurtEvent,
  WeaponFireEvent,
} from "@demo-viewer/domain/src/entities/events";
import { MockMatchOutboundPort } from "./mocks/MockMatchOutboundPort.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKill(weapon = "AK-47", isHeadshot = false): KillEvent {
  return new KillEvent(
    "player1",
    "Player1",
    "victim1",
    "Victim",
    null,
    null,
    weapon,
    isHeadshot,
    0,
  );
}

function makeDeath(weapon = "AWP"): KillEvent {
  return new KillEvent(
    "enemy1",
    "Enemy",
    "player1",
    "Player1",
    null,
    null,
    weapon,
    false,
    0,
  );
}

function makeHurt(
  weapon: "AK-47" | "AWP" | "M4A4" | "HE Grenade" = "AK-47",
  healthDamage = 50,
  armorDamage = 10,
): PlayerHurtEvent {
  return new PlayerHurtEvent(
    "victim1",
    "Victim",
    "player1",
    "Player1",
    healthDamage,
    armorDamage,
    weapon,
    "Chest",
  );
}

function makeShot(weapon = "AK-47"): WeaponFireEvent {
  return new WeaponFireEvent("player1", "Player1", weapon);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const MATCH_ID = "match-1";
const PLAYER_STEAM_ID = "player1";

describe("MatchPlayerWeaponStatsCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchPlayerWeaponStatsCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    calc = new MatchPlayerWeaponStatsCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
  });

  // -------------------------------------------------------------------------
  describe("getKillsPerWeapon", () => {
    test("returns empty object when there are no kill events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getKillsPerWeapon()).toEqual({});
    });

    test("counts kills per weapon", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47"), makeKill("AK-47"), makeKill("AWP")],
        [],
        [],
        [],
      ];
      const result = await calc.getKillsPerWeapon();
      expect(result["AK-47"]).toBe(2);
      expect(result["AWP"]).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getDeathsPerWeapon", () => {
    test("returns empty object when there are no death events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getDeathsPerWeapon()).toEqual({});
    });

    test("counts deaths per weapon (weapon used against the player)", async () => {
      mock.aggregatedEventsResult = [
        [],
        [makeDeath("AWP"), makeDeath("AWP"), makeDeath("AK-47")],
        [],
        [],
      ];
      const result = await calc.getDeathsPerWeapon();
      expect(result["AWP"]).toBe(2);
      expect(result["AK-47"]).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getHitsPerWeapon", () => {
    test("returns empty object when there are no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getHitsPerWeapon()).toEqual({});
    });

    test("counts hits per weapon", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [makeHurt("AK-47"), makeHurt("AK-47"), makeHurt("M4A4")],
        [],
      ];
      const result = await calc.getHitsPerWeapon();
      expect(result["AK-47"]).toBe(2);
      expect(result["M4A4"]).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getShotsPerWeapon", () => {
    test("returns empty object when there are no fire events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getShotsPerWeapon()).toEqual({});
    });

    test("counts shots per weapon", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [],
        [makeShot("AK-47"), makeShot("AK-47"), makeShot("AK-47"), makeShot("M4A4")],
      ];
      const result = await calc.getShotsPerWeapon();
      expect(result["AK-47"]).toBe(3);
      expect(result["M4A4"]).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getDamagePerWeapon", () => {
    test("returns empty object when there are no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getDamagePerWeapon()).toEqual({});
    });

    test("sums healthDamage + armorDamage per weapon", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [
          makeHurt("AK-47", 80, 20),  // 100 total
          makeHurt("AK-47", 40, 10),  // 50 total
          makeHurt("M4A4", 60, 5),    // 65 total
        ],
        [],
      ];
      const result = await calc.getDamagePerWeapon();
      expect(result["AK-47"]).toBe(150);
      expect(result["M4A4"]).toBe(65);
    });
  });

  // -------------------------------------------------------------------------
  describe("getHeadshotsPerWeapon", () => {
    test("returns empty object when there are no kills", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getHeadshotsPerWeapon()).toEqual({});
    });

    test("only counts headshot kills", async () => {
      mock.aggregatedEventsResult = [
        [
          makeKill("AK-47", true),
          makeKill("AK-47", true),
          makeKill("AK-47", false), // not a headshot
          makeKill("AWP", true),
        ],
        [],
        [],
        [],
      ];
      const result = await calc.getHeadshotsPerWeapon();
      expect(result["AK-47"]).toBe(2);
      expect(result["AWP"]).toBe(1);
    });

    test("returns empty object when all kills are body shots", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47", false), makeKill("AK-47", false)],
        [],
        [],
        [],
      ];
      expect(await calc.getHeadshotsPerWeapon()).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  describe("getWeaponStats", () => {
    test("returns empty array when there are no events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      expect(await calc.getWeaponStats()).toEqual([]);
    });

    test("aggregates all metrics per weapon into a single entry", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47", true), makeKill("AK-47", false)], // 2 kills, 1 hs
        [makeDeath("AK-47")],                                 // 1 death
        [makeHurt("AK-47", 80, 20), makeHurt("AK-47", 40, 5)], // 2 hits, 145 dmg
        [makeShot("AK-47"), makeShot("AK-47"), makeShot("AK-47")], // 3 shots
      ];
      const stats = await calc.getWeaponStats();
      expect(stats).toHaveLength(1);
      const ak = stats.find((s) => s.weaponName === "AK-47")!;
      expect(ak.kills).toBe(2);
      expect(ak.deaths).toBe(1);
      expect(ak.hits).toBe(2);
      expect(ak.shots).toBe(3);
      expect(ak.damage).toBe(145);
      expect(ak.headshots).toBe(1);
    });

    test("produces separate entries for each weapon encountered", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47"), makeKill("AWP")],
        [],
        [],
        [],
      ];
      const stats = await calc.getWeaponStats();
      expect(stats).toHaveLength(2);
      const names = stats.map((s) => s.weaponName);
      expect(names).toContain("AK-47");
      expect(names).toContain("AWP");
    });

    test("collects weapon names from all event types", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47")],          // kill with AK
        [makeDeath("AWP")],           // died to AWP
        [makeHurt("M4A4")],           // hurt with M4A4
        [makeShot("HE Grenade")],     // fired HE Grenade
      ];
      const stats = await calc.getWeaponStats();
      const names = stats.map((s) => s.weaponName);
      expect(names).toContain("AK-47");
      expect(names).toContain("AWP");
      expect(names).toContain("M4A4");
      expect(names).toContain("HE Grenade");
    });

    test("zero-fills metrics for weapons that only appear in some event types", async () => {
      // AWP only appears as a kill weapon — no shots, hits or deaths recorded
      mock.aggregatedEventsResult = [
        [makeKill("AWP", true)],
        [],
        [],
        [],
      ];
      const stats = await calc.getWeaponStats();
      const awp = stats.find((s) => s.weaponName === "AWP")!;
      expect(awp.kills).toBe(1);
      expect(awp.deaths).toBe(0);
      expect(awp.hits).toBe(0);
      expect(awp.shots).toBe(0);
      expect(awp.damage).toBe(0);
      expect(awp.headshots).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns weapons array with correct aggregated data", async () => {
      mock.aggregatedEventsResult = [
        [makeKill("AK-47", true)],
        [makeDeath("AWP")],
        [makeHurt("AK-47", 100, 0)],
        [makeShot("AK-47"), makeShot("AK-47")],
      ];
      const result = await calc.calculate();
      expect(result.weapons).toHaveLength(2);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("returns empty weapons array when there are no events", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      const result = await calc.calculate();
      expect(result.weapons).toEqual([]);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("does not include statsId in the result", async () => {
      mock.aggregatedEventsResult = [[], [], [], []];
      const result = await calc.calculate();
      expect("statsId" in result).toBe(false);
    });
  });
});
