import { useDemoViewerViewModel } from "../../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Space, Typography } from "antd";
import { useEffect, useState } from "react";
import type { GameStateDto, ManifestRoundDto } from "@demo-viewer/shared-types";
import { Paper } from "../../../components/Paper";

interface TickEvent {
  round: ManifestRoundDto | null | undefined;
  gameState: GameStateDto;
}

export const ScoreOutput = () => {
  const { matchData, subscribe } = useDemoViewerViewModel();
  const [score, setScore] = useState<TickEvent | null>(null);

  useEffect(() => {
    subscribe((event, data) => {
      if (event === "tick") {
        setScore(data as TickEvent);
      }
    });
  }, []);

  return (
    <Space orientation="horizontal" className="justify-between">
      <Paper className="flex flex-col gap-2 border p-2">
        <Typography>
          Current round: {score?.round?.roundNumber ?? 0} / Total rounds:{" "}
          {matchData.matchManifest.rounds.at(-1)?.roundNumber}
        </Typography>
        <Typography>
          <Typography.Text>T: {score?.gameState.tScore ?? 0}</Typography.Text> /{" "}
          <Typography.Text>CT: {score?.gameState.ctScore ?? 0}</Typography.Text>
          {score?.round?.winner && (
            <>
              {" "}
              /{" "}
              <Typography.Text>
                Round winner: {score?.round?.winner}
              </Typography.Text>
            </>
          )}
        </Typography>
      </Paper>
    </Space>
  );
};
