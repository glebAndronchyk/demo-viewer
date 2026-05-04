import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useResizeObserver } from "../../lib/hooks/useResizeObserver.ts";
import { clsx } from "../../lib/clsx.ts";
import { debounce } from "../../lib/debounce.ts";

export interface TimeLineRef {
  getIsDragging: () => boolean;
  moveSlider: (gameTick: number) => void;
}

interface TimeLineProps {
  totalTicks: number;
  tickRate: number;
  onSliderMove: (gameTick: number, px: number) => void;
  notchWidthPx?: number;
  /**
   * [0, 1]
   */
  batchPercentage?: number;
  moveDebounce?: number;
  isAnchor?: (index: number) => boolean;
  markers?: { gameTick: number; node: ReactNode }[];

  ref?: Ref<TimeLineRef>;
}

interface TimeLineNotchProps {
  style: CSSProperties;
  tick: number | null;
}

interface TimeLineSliderProps {
  onMouseDown: () => void;
  className?: string;
  ref: Ref<HTMLDivElement>;
}

const DEFAULT_BATCH_PERCENTAGE = 0.05;
const DEFAULT_ANCHOR_RANGE = 3;
const DEFAULT_MOVE_DEBOUNCE = 150;

export const TimeLine = (props: TimeLineProps) => {
  const isAnchorCallback =
    props.isAnchor || ((tick: number) => tick % DEFAULT_ANCHOR_RANGE === 0);
  const batchPercentage = props.batchPercentage || DEFAULT_BATCH_PERCENTAGE;
  const notchWidthPx = props.notchWidthPx ?? 2;

  const [config] = useState(() => ({
    startTick: 0,
    endTick: props.totalTicks,
  }));
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null as never as HTMLDivElement);
  const sliderRef = useRef<HTMLDivElement>(null as never as HTMLDivElement);
  const { width: cw } = useResizeObserver({
    ref: containerRef,
    box: "border-box",
  });

  const totalNotches = config.endTick / (config.endTick * batchPercentage);
  const notchGap = ((cw ?? 0) - totalNotches * notchWidthPx) / totalNotches;

  const pxToTick = useCallback(
    (px: number) => {
      if (!cw) return config.startTick;
      const ratio = px / cw;
      return Math.round(
        config.startTick + ratio * (config.endTick - config.startTick),
      );
    },
    [config, cw],
  );
  const tickToPx = (tick: number): number => {
    if (!cw) return 0;
    const ratio =
      (tick - config.startTick) / (config.endTick - config.startTick);
    return ratio * cw;
  };
  const indexToPx = (i: number) => i * notchWidthPx + i * notchGap;

  const { onSliderMove, moveDebounce } = props;

  useEffect(() => {
    const debouncedPropagate = debounce((px: number) => {
      onSliderMove(pxToTick(px), px);
    }, moveDebounce ?? DEFAULT_MOVE_DEBOUNCE);

    const handleSliderMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, cw ?? rect.width));
      sliderRef.current.style.left = `${x}px`;

      debouncedPropagate(x);
    };

    const handleSliderUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("pointermove", handleSliderMove);
    window.addEventListener("pointerup", handleSliderUp);

    return () => {
      window.removeEventListener("pointermove", handleSliderMove);
      window.removeEventListener("pointerup", handleSliderUp);
    };
  }, [pxToTick, onSliderMove, moveDebounce, cw]);

  useImperativeHandle(props.ref, () => ({
    moveSlider: (gameTick: number) => {
      if (!sliderRef.current) return;
      sliderRef.current.style.left = `${tickToPx(gameTick)}px`;
    },
    getIsDragging: () => isDragging.current,
  }));

  return (
    <div ref={containerRef} className="w-full h-9 border relative select-none">
      {Array.from({ length: totalNotches }).map((_, i) => {
        const isAnchor = isAnchorCallback(i);
        return (
          <TimeLine.Notch
            key={i}
            tick={isAnchor ? pxToTick(indexToPx(i)) : null}
            style={{
              position: "absolute",
              left: indexToPx(i),
              width: notchWidthPx,
              background: "red",
              height: isAnchor ? "20px" : "10px",
            }}
          />
        );
      })}
      <TimeLine.Slider
        ref={sliderRef}
        onMouseDown={() => (isDragging.current = true)}
        className="absolute left-0"
      />
    </div>
  );
};

TimeLine.Slider = (props: TimeLineSliderProps) => {
  return (
    <div
      ref={props.ref}
      onMouseDown={props.onMouseDown}
      className={clsx(
        props.className,
        "h-full w-[2px] bg-black cursor-pointer",
      )}
    />
  );
};

TimeLine.Notch = (props: TimeLineNotchProps) => {
  return (
    <div className="relative" style={props.style}>
      {props.tick}
    </div>
  );
};
