import { describe, test, expect, beforeEach } from "bun:test";
import { MatchPlayerUtilityUsageCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerUtilityUsageCalculator.ts";
import { PlayerFlashedEvent } from "@demo-viewer/domain/src/entities/events/PlayerFlashedEvent.ts";
import { GrenadeThrowEvent } from "@demo-viewer/domain/src/entities/events/GrenadeThrowEvent.ts";
import { PlayerHurtEvent } from "@demo-viewer/domain/src/entities/events/PlayerHurtEvent.ts";
import type { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort.ts";
import type { TeamType } from "@demo-viewer/domain/src/entities/TeamType.ts";
import type { GrenadesWeaponType } from "@demo-viewer/domain/src/entities/WeaponType.ts";
import type { WeaponType } from "@demo-viewer/domain/src/entities/WeaponType.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CT: TeamType = "CT";
const T: TeamType = "T";
const POS = { x: 0, y: 0, z: 0 };

function makeThrow(weapon: GrenadesWeaponType): GrenadeThrowEvent {
  return new GrenadeThrowEvent("player1", "Player1", weapon, 1, POS);
}

function makeThrows(
  weapon: GrenadesWeaponType,
  count: number,
): GrenadeThrowEvent[] {
  return Array.from({ length: count }, () => makeThrow(weapon));
}

function makeFlashed(
  attackerTeam: TeamType,
  playerTeam: TeamType,
  flashDuration: number | null = 1.5,
): PlayerFlashedEvent {
  return new PlayerFlashedEvent(
    "victim1",
    "Victim",
    "player1",
    "Player1",
    flashDuration,
    attackerTeam,
    playerTeam,
  );
}

function makeHurt(weapon: WeaponType): PlayerHurtEvent {
  return new PlayerHurtEvent(
    "victim1",
    "Victim",
    "player1",
    "Player1",
    50,
    0,
    weapon,
    "Chest",
  );
}

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

type EventsTuple = [
  PlayerFlashedEvent[],
  GrenadeThrowEvent[],
  PlayerHurtEvent[],
];

class MockMatchOutboundPort implements MatchOutboundPort {
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

describe("MatchPlayerUtilityUsageCalculator", () => {
  let mock: MockMatchOutboundPort;
  let calc: MatchPlayerUtilityUsageCalculator;

  beforeEach(() => {
    mock = new MockMatchOutboundPort();
    calc = new MatchPlayerUtilityUsageCalculator(
      MATCH_ID,
      PLAYER_STEAM_ID,
      mock,
    );
  });

  // -------------------------------------------------------------------------
  describe("getTotalGrenadesThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalGrenadesThrown()).toBe(0);
    });

    test("counts all thrown grenades regardless of type", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("HE Grenade"),
          makeThrow("Smoke Grenade"),
          makeThrow("Flashbang"),
          makeThrow("Molotov"),
        ],
        [],
      ];
      expect(await calc.getTotalGrenadesThrown()).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalHeThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalHeThrown()).toBe(0);
    });

    test("counts only HE grenades", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("HE Grenade"),
          makeThrow("HE Grenade"),
          makeThrow("Flashbang"),
        ],
        [],
      ];
      expect(await calc.getTotalHeThrown()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalSmokesThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalSmokesThrown()).toBe(0);
    });

    test("counts only smoke grenades", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("Smoke Grenade"),
          makeThrow("Smoke Grenade"),
          makeThrow("HE Grenade"),
        ],
        [],
      ];
      expect(await calc.getTotalSmokesThrown()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalMolotovsThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalMolotovsThrown()).toBe(0);
    });

    test("counts only Molotovs (not incendiaries)", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("Molotov"),
          makeThrow("Molotov"),
          makeThrow("Incendiary Grenade"),
        ],
        [],
      ];
      expect(await calc.getTotalMolotovsThrown()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalFlashesThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalFlashesThrown()).toBe(0);
    });

    test("counts only flashbangs", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("Flashbang"),
          makeThrow("Flashbang"),
          makeThrow("Smoke Grenade"),
        ],
        [],
      ];
      expect(await calc.getTotalFlashesThrown()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalIncendiariesThrown", () => {
    test("returns 0 when no grenades thrown", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalIncendiariesThrown()).toBe(0);
    });

    test("counts only incendiary grenades (not molotovs)", async () => {
      mock.aggregatedEventsResult = [
        [],
        [
          makeThrow("Incendiary Grenade"),
          makeThrow("Incendiary Grenade"),
          makeThrow("Molotov"),
        ],
        [],
      ];
      expect(await calc.getTotalIncendiariesThrown()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalTeammatesFlashed", () => {
    test("returns 0 when nobody flashed", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalTeammatesFlashed()).toBe(0);
    });

    test("counts players where attacker and player are on the same team", async () => {
      mock.aggregatedEventsResult = [
        [
          makeFlashed(CT, CT), // teammate
          makeFlashed(CT, CT), // teammate
          makeFlashed(CT, T), // enemy — should not count
        ],
        [],
        [],
      ];
      expect(await calc.getTotalTeammatesFlashed()).toBe(2);
    });

    test("returns 0 when only enemies are flashed", async () => {
      mock.aggregatedEventsResult = [
        [makeFlashed(CT, T), makeFlashed(CT, T)],
        [],
        [],
      ];
      expect(await calc.getTotalTeammatesFlashed()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalEnemiesFlashed", () => {
    test("returns 0 when nobody flashed", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalEnemiesFlashed()).toBe(0);
    });

    test("counts players where attacker and player are on different teams", async () => {
      mock.aggregatedEventsResult = [
        [
          makeFlashed(CT, T), // enemy
          makeFlashed(CT, T), // enemy
          makeFlashed(CT, CT), // teammate — should not count
        ],
        [],
        [],
      ];
      expect(await calc.getTotalEnemiesFlashed()).toBe(2);
    });

    test("returns 0 when only teammates are flashed", async () => {
      mock.aggregatedEventsResult = [
        [makeFlashed(CT, CT), makeFlashed(CT, CT)],
        [],
        [],
      ];
      expect(await calc.getTotalEnemiesFlashed()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("getTotalMolotovsDamage", () => {
    test("returns 0 when no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getTotalMolotovsDamage()).toBe(0);
    });

    test("counts hurt events caused by Molotov or Incendiary Grenade", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [
          makeHurt("Molotov"),
          makeHurt("Incendiary Grenade"),
          makeHurt("HE Grenade"), // should not count
        ],
      ];
      expect(await calc.getTotalMolotovsDamage()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getHeDamage", () => {
    test("returns 0 when no hurt events", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getHeDamage()).toBe(0);
    });

    test("counts hurt events caused by HE Grenade only", async () => {
      mock.aggregatedEventsResult = [
        [],
        [],
        [
          makeHurt("HE Grenade"),
          makeHurt("HE Grenade"),
          makeHurt("Molotov"), // should not count
        ],
      ];
      expect(await calc.getHeDamage()).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("getFlashDuration", () => {
    test("returns 0 when nobody flashed", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      expect(await calc.getFlashDuration()).toBe(0);
    });

    test("sums flashDuration for enemies only", async () => {
      mock.aggregatedEventsResult = [
        [
          makeFlashed(CT, T, 2.0), // enemy — counts
          makeFlashed(CT, T, 1.5), // enemy — counts
          makeFlashed(CT, CT, 3.0), // teammate — should not count
        ],
        [],
        [],
      ];
      expect(await calc.getFlashDuration()).toBeCloseTo(3.5);
    });

    test("treats null flashDuration as 0", async () => {
      mock.aggregatedEventsResult = [
        [makeFlashed(CT, T, null), makeFlashed(CT, T, 1.0)],
        [],
        [],
      ];
      expect(await calc.getFlashDuration()).toBeCloseTo(1.0);
    });
  });

  // -------------------------------------------------------------------------
  describe("calculate", () => {
    test("returns all zeroes when there are no events", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      const result = await calc.calculate();

      expect(result.grenadesThrown).toBe(0);
      expect(result.heThrown).toBe(0);
      expect(result.smokesThrown).toBe(0);
      expect(result.molotovsThrown).toBe(0);
      expect(result.flashesThrown).toBe(0);
      expect(result.incendiariesThrown).toBe(0);
      expect(result.teammatesFlashed).toBe(0);
      expect(result.enemiesFlashed).toBe(0);
      expect(result.molotovsDamage).toBe(0);
      expect(result.heDamage).toBe(0);
      expect(result.flashDuration).toBe(0);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("returns correct aggregated values for mixed events", async () => {
      mock.aggregatedEventsResult = [
        [makeFlashed(CT, T, 2.0), makeFlashed(CT, CT, 1.0)],
        [
          ...makeThrows("HE Grenade", 2),
          ...makeThrows("Smoke Grenade", 3),
          makeThrow("Flashbang"),
          makeThrow("Molotov"),
        ],
        [makeHurt("HE Grenade"), makeHurt("Molotov")],
      ];

      const result = await calc.calculate();

      expect(result.grenadesThrown).toBe(7);
      expect(result.heThrown).toBe(2);
      expect(result.smokesThrown).toBe(3);
      expect(result.molotovsThrown).toBe(1);
      expect(result.flashesThrown).toBe(1);
      expect(result.incendiariesThrown).toBe(0);
      expect(result.enemiesFlashed).toBe(1);
      expect(result.teammatesFlashed).toBe(1);
      expect(result.heDamage).toBe(1);
      expect(result.molotovsDamage).toBe(1);
      expect(result.flashDuration).toBeCloseTo(2.0);
      expect(result.dateRecorded).toBeInstanceOf(Date);
    });

    test("does not include statsId in the result", async () => {
      mock.aggregatedEventsResult = [[], [], []];
      const result = await calc.calculate();
      expect("statsId" in result).toBe(false);
    });
  });
});
