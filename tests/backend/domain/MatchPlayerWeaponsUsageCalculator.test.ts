import { describe, test, expect, beforeEach } from "bun:test";
import { MatchPlayerWeaponsUsageCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerWeaponsUsageCalculator.ts";
import { WeaponFireEvent } from "@demo-viewer/domain/src/entities/events";
import type { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShot(weapon: string): WeaponFireEvent {
  return new WeaponFireEvent("player1", "Player1", weapon);
}

function makeShots(weapon: string, count: number): WeaponFireEvent[] {
  return Array.from({ length: count }, () => makeShot(weapon));
}

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

type EventsTuple = [WeaponFireEvent[]];

class MockMatchOutboundPort implements MatchOutboundPort {
  aggregatedEventsResult: EventsTuple = [[]];

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

describe("MatchPlayerWeaponsUsageCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchPlayerWeaponsUsageCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
  });

  // -------------------------------------------------------------------------
  describe("getPistolsPct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getPistolsPct()).toBe(0);
    });

    test("returns 1 when all shots are pistol shots", async () => {
      mock.aggregatedEventsResult = [[...makeShots("Desert Eagle", 5)]];
      expect(await calc.getPistolsPct()).toBe(1);
    });

    test("returns correct fraction for mixed weapons", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("Glock-18", 2),   // 2 pistol shots
          ...makeShots("AK-47", 8),      // 8 rifle shots
        ],
      ];
      expect(await calc.getPistolsPct()).toBe(0.2);
    });

    test("covers all pistol variants", async () => {
      const pistolWeapons = [
        "P2000", "Glock-18", "P250", "Desert Eagle", "Five-SeveN",
        "Dual Berettas", "Tec-9", "CZ75 Auto", "USP-S", "R8 Revolver",
      ];
      for (const weapon of pistolWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getPistolsPct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getUtilityPct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getUtilityPct()).toBe(0);
    });

    test("returns 1 when all shots are utility", async () => {
      mock.aggregatedEventsResult = [[...makeShots("HE Grenade", 3)]];
      expect(await calc.getUtilityPct()).toBe(1);
    });

    test("covers all utility/grenade types", async () => {
      const utilityWeapons = [
        "HE Grenade", "Flashbang", "Smoke Grenade",
        "Molotov", "Incendiary Grenade", "Decoy Grenade",
      ];
      for (const weapon of utilityWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getUtilityPct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getMeleePct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getMeleePct()).toBe(0);
    });

    test("returns 1 when all events are melee", async () => {
      mock.aggregatedEventsResult = [[makeShot("Knife"), makeShot("Zeus x27")]];
      expect(await calc.getMeleePct()).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("getShotgunsPct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getShotgunsPct()).toBe(0);
    });

    test("returns correct fraction for shotgun shots", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("Nova", 3),
          ...makeShots("AK-47", 7),
        ],
      ];
      expect(await calc.getShotgunsPct()).toBe(0.3);
    });

    test("covers all shotgun variants", async () => {
      const shotgunWeapons = ["Sawed-Off", "Nova", "MAG-7", "XM1014"];
      for (const weapon of shotgunWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getShotgunsPct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getSmgPct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getSmgPct()).toBe(0);
    });

    test("returns correct fraction for SMG shots", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("MP9", 4),
          ...makeShots("AK-47", 6),
        ],
      ];
      expect(await calc.getSmgPct()).toBe(0.4);
    });

    test("covers all SMG variants", async () => {
      const smgWeapons = ["MP7", "MP9", "PP-Bizon", "MAC-10", "UMP-45", "P90", "MP5-SD"];
      for (const weapon of smgWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getSmgPct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getAssaultRiflePct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getAssaultRiflePct()).toBe(0);
    });

    test("returns 1 when all shots are assault rifles", async () => {
      mock.aggregatedEventsResult = [[...makeShots("AK-47", 10)]];
      expect(await calc.getAssaultRiflePct()).toBe(1);
    });

    test("covers all assault rifle variants", async () => {
      const arWeapons = ["Galil AR", "FAMAS", "AK-47", "M4A4", "M4A1", "SG 553", "AUG"];
      for (const weapon of arWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getAssaultRiflePct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getSniperRiflePct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getSniperRiflePct()).toBe(0);
    });

    test("returns correct fraction for sniper shots", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("AWP", 1),
          ...makeShots("AK-47", 9),
        ],
      ];
      expect(await calc.getSniperRiflePct()).toBe(0.1);
    });

    test("covers all sniper rifle variants", async () => {
      const sniperWeapons = ["SSG 08", "AWP", "SCAR-20", "G3SG1"];
      for (const weapon of sniperWeapons) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getSniperRiflePct()).toBe(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("getMachineGunPct", () => {
    test("returns 0 when there are no shots", async () => {
      mock.aggregatedEventsResult = [[]];
      expect(await calc.getMachineGunPct()).toBe(0);
    });

    test("covers M249 and Negev", async () => {
      for (const weapon of ["M249", "Negev"]) {
        mock = new MockMatchOutboundPort();
        calc = new MatchPlayerWeaponsUsageCalculator(MATCH_ID, PLAYER_STEAM_ID, mock);
        mock.aggregatedEventsResult = [[makeShot(weapon)]];
        expect(await calc.getMachineGunPct()).toBe(1);
      }
    });

    test("returns correct fraction for machine gun shots", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("M249", 5),
          ...makeShots("AK-47", 5),
        ],
      ];
      expect(await calc.getMachineGunPct()).toBe(0.5);
    });
  });

  // -------------------------------------------------------------------------
  describe("percentages across categories", () => {
    test("all category percentages sum to 1 when every shot belongs to a category", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("Glock-18", 10),    // pistols
          ...makeShots("AK-47", 20),       // assault rifle
          ...makeShots("AWP", 10),         // sniper
          ...makeShots("MP9", 10),         // smg
          ...makeShots("Nova", 10),        // shotgun
          ...makeShots("HE Grenade", 10),  // utility
          ...makeShots("Knife", 10),       // melee
          ...makeShots("M249", 20),        // machine gun
        ],
      ];
      const [p, ar, sn, smg, sg, ut, ml, mg] = await Promise.all([
        calc.getPistolsPct(),
        calc.getAssaultRiflePct(),
        calc.getSniperRiflePct(),
        calc.getSmgPct(),
        calc.getShotgunsPct(),
        calc.getUtilityPct(),
        calc.getMeleePct(),
        calc.getMachineGunPct(),
      ]);
      const total = p + ar + sn + smg + sg + ut + ml + mg;
      expect(total).toBeCloseTo(1, 10);
    });

    test("returns 0 for categories with no shots when other categories are present", async () => {
      mock.aggregatedEventsResult = [[...makeShots("AK-47", 10)]];
      expect(await calc.getPistolsPct()).toBe(0);
      expect(await calc.getSniperRiflePct()).toBe(0);
      expect(await calc.getSmgPct()).toBe(0);
      expect(await calc.getUtilityPct()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns all zeroes when there are no fire events", async () => {
      mock.aggregatedEventsResult = [[]];
      const result = await calc.calculate();
      expect(result.pistolsPct).toBe(0);
      expect(result.utilityPct).toBe(0);
      expect(result.meleePct).toBe(0);
      expect(result.shotgunsPct).toBe(0);
      expect(result.smgPct).toBe(0);
      expect(result.assaultRiflePct).toBe(0);
      expect(result.sniperRiflePct).toBe(0);
      expect(result.machineGunPct).toBe(0);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("returns correct percentages for mixed usage", async () => {
      mock.aggregatedEventsResult = [
        [
          ...makeShots("AK-47", 6),    // 60% assault rifle
          ...makeShots("AWP", 2),      // 20% sniper
          ...makeShots("Glock-18", 2), // 20% pistol
        ],
      ];
      const result = await calc.calculate();
      expect(result.assaultRiflePct).toBeCloseTo(0.6);
      expect(result.sniperRiflePct).toBeCloseTo(0.2);
      expect(result.pistolsPct).toBeCloseTo(0.2);
      expect(result.smgPct).toBe(0);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("does not include statsId in the result", async () => {
      mock.aggregatedEventsResult = [[]];
      const result = await calc.calculate();
      expect("statsId" in result).toBe(false);
    });
  });
});
