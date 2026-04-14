import { describe, test, expect } from "bun:test";
import { detectClutchRounds } from "@demo-viewer/api/src/repository/MatchRepository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFrame(
  demo_tick: number,
  myTeam: string,
  aliveTeammates: number,
  aliveEnemies: number,
) {
  return { demo_tick, counts: { myTeam, aliveTeammates, aliveEnemies } };
}

function makeRound(id: number, frames: ReturnType<typeof makeFrame>[]) {
  return { _id: id, frames };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("detectClutchRounds", () => {
  describe("basic clutch detection", () => {
    test("returns a won clutch when player is last alive and team wins", () => {
      const round = makeRound(1, [
        makeFrame(1, "CT", 3, 2),
        makeFrame(2, "CT", 2, 2),
        makeFrame(3, "CT", 1, 2), // clutch starts: 1v2
        makeFrame(4, "CT", 1, 1),
        makeFrame(5, "CT", 1, 0),
      ]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 2, outcome: "won" }]);
    });

    test("returns a lost clutch when player is last alive and team loses", () => {
      const round = makeRound(1, [
        makeFrame(1, "T", 2, 3),
        makeFrame(2, "T", 1, 3), // clutch starts: 1v3
      ]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 3, outcome: "lost" }]);
    });

    test("records vs as enemy count at the moment team drops to 1, not the minimum", () => {
      const round = makeRound(1, [
        makeFrame(1, "CT", 2, 5),
        makeFrame(2, "CT", 1, 4), // clutch starts here with 4 enemies
        makeFrame(3, "CT", 1, 3),
        makeFrame(4, "CT", 1, 2),
      ]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 4, outcome: "won" }]);
    });
  });

  describe("frame ordering", () => {
    test("sorts frames by demo_tick before detecting clutch", () => {
      // Frames provided out of order — clutch at tick 3
      const round = makeRound(1, [
        makeFrame(5, "CT", 1, 1),
        makeFrame(3, "CT", 1, 2), // first chronologically where aliveTeammates===1
        makeFrame(1, "CT", 3, 2),
      ]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 2, outcome: "won" }]);
    });
  });

  describe("edge cases that should be skipped", () => {
    test("skips round when player dies before being last alive (never reaches aliveTeammates===1)", () => {
      const round = makeRound(1, [
        makeFrame(1, "CT", 3, 5),
        makeFrame(2, "CT", 2, 4),
        // player dies — no more frames where player is alive
      ]);
      const result = detectClutchRounds([round], new Map([[1, "T"]]));
      expect(result).toHaveLength(0);
    });

    test("skips round when aliveEnemies is 0 at clutch moment", () => {
      const round = makeRound(1, [
        makeFrame(1, "CT", 2, 1),
        makeFrame(2, "CT", 1, 0), // last alive but no enemies left
      ]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toHaveLength(0);
    });

    test("skips round when round number is not in the winner map", () => {
      const round = makeRound(99, [makeFrame(1, "CT", 1, 2)]);
      const result = detectClutchRounds([round], new Map([[1, "CT"]]));
      expect(result).toHaveLength(0);
    });

    test("returns empty array when rawFrames is empty", () => {
      const result = detectClutchRounds([], new Map([[1, "CT"]]));
      expect(result).toHaveLength(0);
    });
  });

  describe("1vN varieties", () => {
    test("detects 1v1", () => {
      const round = makeRound(1, [makeFrame(1, "T", 1, 1)]);
      const result = detectClutchRounds([round], new Map([[1, "T"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 1, outcome: "won" }]);
    });

    test("detects 1v5", () => {
      const round = makeRound(1, [makeFrame(1, "T", 1, 5)]);
      const result = detectClutchRounds([round], new Map([[1, "T"]]));
      expect(result).toEqual([{ roundNumber: 1, vs: 5, outcome: "won" }]);
    });
  });

  describe("multiple rounds", () => {
    test("returns results for all clutch rounds independently", () => {
      const rounds = [
        makeRound(1, [makeFrame(1, "CT", 1, 2)]),
        makeRound(2, [makeFrame(1, "T", 3, 3)]), // not a clutch
        makeRound(3, [makeFrame(1, "CT", 1, 1)]),
      ];
      const winnerMap = new Map([
        [1, "T"],  // player CT loses
        [2, "T"],
        [3, "CT"], // player CT wins
      ]);
      const result = detectClutchRounds(rounds, winnerMap);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ roundNumber: 1, vs: 2, outcome: "lost" });
      expect(result).toContainEqual({ roundNumber: 3, vs: 1, outcome: "won" });
    });
  });

  describe("team sides", () => {
    test("correctly identifies outcome for T-side player", () => {
      const round = makeRound(5, [makeFrame(1, "T", 1, 3)]);
      const result = detectClutchRounds([round], new Map([[5, "T"]]));
      expect(result).toEqual([{ roundNumber: 5, vs: 3, outcome: "won" }]);
    });

    test("correctly identifies lost outcome for T-side player when CT wins", () => {
      const round = makeRound(5, [makeFrame(1, "T", 1, 3)]);
      const result = detectClutchRounds([round], new Map([[5, "CT"]]));
      expect(result).toEqual([{ roundNumber: 5, vs: 3, outcome: "lost" }]);
    });
  });
});
