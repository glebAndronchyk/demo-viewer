type ClutchFrame = {
  demo_tick: number;
  counts: { myTeam: string; aliveTeammates: number; aliveEnemies: number };
};

export type RawClutchRound = { _id: number; frames: ClutchFrame[] };

export function detectClutchRounds(
  rawFrames: RawClutchRound[],
  roundWinnerMap: Map<number, string>,
): { roundNumber: number; vs: number; outcome: "lost" | "won" }[] {
  const results: {
    roundNumber: number;
    vs: number;
    outcome: "lost" | "won";
  }[] = [];

  for (const round of rawFrames) {
    const roundNumber = round._id;
    const winner = roundWinnerMap.get(roundNumber);
    if (!winner) continue;

    const frames = round.frames
      .slice()
      .sort((a, b) => a.demo_tick - b.demo_tick);

    let clutchEnemyCount: number | null = null;
    let playerTeam: string | null = null;

    for (const frame of frames) {
      const { myTeam, aliveTeammates, aliveEnemies } = frame.counts;
      if (!playerTeam) playerTeam = myTeam;

      if (aliveTeammates === 1) {
        clutchEnemyCount = aliveEnemies;
        break;
      }
    }

    if (clutchEnemyCount === null || clutchEnemyCount === 0 || !playerTeam)
      continue;

    const outcome = winner === playerTeam ? "won" : "lost";
    results.push({ roundNumber, vs: clutchEnemyCount, outcome });
  }

  return results;
}
