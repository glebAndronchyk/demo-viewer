import {
  TimeLine,
  type TimeLineRef,
} from "../../../components/TimeLine/TimeLine.tsx";
import { useEffect, useRef } from "react";
import { useDemoViewerViewModel } from "../../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";

export const DemoPlayerTimeLine = () => {
  const { subscribe, jump, matchData } = useDemoViewerViewModel();
  const isTransition = useRef(false);

  const tickTimeLineRef = useRef<TimeLineRef>(null);

  const handleJump = async (gameTick: number) => {
    isTransition.current = true;
    await jump(gameTick);
    isTransition.current = false;
  };

  useEffect(() => {
    return subscribe((event, data) => {
      const castedData = data as { gameTick: number };

      if (
        event === "tick" &&
        !tickTimeLineRef.current?.getIsDragging() &&
        !isTransition.current
      ) {
        tickTimeLineRef.current?.moveSlider(castedData.gameTick);
      }
    });
  }, []);

  return (
    <TimeLine
      tickRate={matchData.matchManifest.tickRate}
      totalTicks={matchData.matchManifest.totalTicks}
      ref={tickTimeLineRef}
      onSliderMove={handleJump}
    />
  );
};
