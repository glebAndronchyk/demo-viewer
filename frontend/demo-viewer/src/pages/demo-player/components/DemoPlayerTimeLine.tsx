import {
  TimeLine,
  type TimeLineRef,
} from "../../../components/TimeLine/TimeLine.tsx";
import { useEffect, useRef, useState } from "react";
import { useDemoViewerViewModel } from "../../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { RoundButton } from "../../../components/RoundButton";
import PlaybackControls, {
  type PlaybackSpeed,
} from "../../../components/PlaybackControls/PlaybackControls.tsx";
import { clsx } from "../../../lib/clsx.ts";

export const DemoPlayerTimeLine = () => {
  const { subscribe, jump, matchData, play, pause, speed, staticState } =
    useDemoViewerViewModel();
  const isTransition = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<PlaybackSpeed>(1);

  const tickTimeLineRef = useRef<TimeLineRef>(null);

  const handleJump = async (gameTick: number) => {
    isTransition.current = true;
    await jump(gameTick);
    isTransition.current = false;
  };

  const stepTicks = (seconds: number) => {
    const ticks = Math.round(seconds * matchData.matchManifest.tickRate);
    jump(staticState.current.currentTick + ticks);
  };

  useEffect(() => {
    return subscribe((event, data) => {
      const castedData = data as { gameTick: number; speed: PlaybackSpeed };

      if (
        event === "tick" &&
        !tickTimeLineRef.current?.getIsDragging() &&
        !isTransition.current
      ) {
        tickTimeLineRef.current?.moveSlider(castedData.gameTick);
      } else if (event === "play") {
        setIsPlaying(true);
      } else if (event === "pause") {
        setIsPlaying(false);
      } else if (event === "speed") {
        setCurrentSpeed(castedData.speed);
      }
    });
  }, []);

  return (
    <div>
      <TimeLine
        tickRate={matchData.matchManifest.tickRate}
        totalTicks={matchData.matchManifest.totalTicks}
        ref={tickTimeLineRef}
        onSliderMove={handleJump}
      >
        {({ containerWidth }) => {
          const rounds = matchData.matchManifest.rounds;
          const totalDuration = rounds.reduce(
            (sum, r) => sum + (r.endGameTick - r.startGameTick),
            0,
          );
          const cw = containerWidth ?? 0;
          let cursor = 0;

          return (
            <div className="relative h-9 w-full">
              {rounds.map((r, i, arr) => {
                const duration = r.endGameTick - r.startGameTick;
                const width = (duration / totalDuration) * cw;
                const left = cursor;
                cursor += width;

                return (
                  <RoundButton
                    key={r.roundNumber}
                    roundNumber={r.roundNumber}
                    style={{ left, width }}
                    className={clsx(
                      "block absolute border-t-0 py-0",
                      i === arr.length - 1 ? "border-r" : "border-r-[0.5px]",
                      r.winner === "CT" && "bg-blue-200", // todo: actual color
                      r.winner === "T" && "bg-red-200", // todo: actual color
                    )}
                    onClick={() => jump(r.startGameTick)}
                  />
                );
              })}
            </div>
          );
        }}
      </TimeLine>
      <PlaybackControls
        playing={isPlaying}
        speed={currentSpeed}
        onPlay={play}
        onPause={pause}
        onStepBack={stepTicks}
        onStepForward={stepTicks}
        onJumpBack={stepTicks}
        onJumpForward={stepTicks}
        onSpeedChange={(s) => speed(s)}
      />
    </div>
  );
};
