import { useEffect, useState } from "react";
import type { useDemoViewerViewModel } from "../viewmodel/DemoViewerViewModel";

type ViewerControlState = {
  currentTick: number;
  finalBufferedTick: number;
  speed: number;
  playbackState: "pause" | "play";
};

export function useViewerState(
  vm: ReturnType<typeof useDemoViewerViewModel>,
): ViewerControlState {
  const [state, setState] = useState<ViewerControlState>({
    currentTick: vm.staticState.current.currentTick,
    finalBufferedTick: vm.staticState.current.finalBufferedTick,
    speed: vm.staticState.current.speed,
    playbackState: vm.staticState.current.state,
  });

  useEffect(() => {
    const consumer = () => {
      setState({
        currentTick: vm.staticState.current.currentTick,
        finalBufferedTick: vm.staticState.current.finalBufferedTick,
        speed: vm.staticState.current.speed,
        playbackState: vm.staticState.current.state,
      });
    };
    vm.subscribe(consumer);
    return () => vm.unsubscribe(consumer);
  }, [vm]);

  return state;
}
