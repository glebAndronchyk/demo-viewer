import { useState, useCallback } from "react";

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

export interface PlaybackControlsProps {
  playing?: boolean;
  speed?: PlaybackSpeed;
  stepSeconds?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onStepBack?: (delta: number) => void;
  onStepForward?: (delta: number) => void;
  onJumpBack?: (delta: number) => void;
  onJumpForward?: (delta: number) => void;
  onSpeedChange?: (speed: PlaybackSpeed) => void;
  style?: React.CSSProperties;
  className?: string;
}

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

function IconBtn({
  onClick,
  primary = false,
  label,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        height: 36,
        minWidth: primary ? 80 : 42,
        padding: primary ? "0 14px" : 0,
        border: "2px solid #2e2118",
        borderRadius: 2,
        background: primary
          ? pressed
            ? "#5a4535"
            : "#2e2118"
          : pressed
            ? "#ede0cc"
            : "#fcfaf7",
        color: primary ? "#fcfaf7" : "#2e2118",
        fontFamily: "'Caveat', cursive",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        userSelect: "none",
        transition: "background 80ms ease, transform 60ms ease",
        transform: pressed ? "scale(0.95)" : "scale(1)",
        outline: "none",
        boxSizing: "border-box",
        letterSpacing: "0.01em",
      }}
      aria-label={label}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => {
        setPressed(false);
        onClick();
      }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => {
        setPressed(false);
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export function PlaybackControls({
  playing = false,
  speed = 1,
  stepSeconds = 5,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onJumpBack,
  onJumpForward,
  onSpeedChange,
  style,
  className,
}: PlaybackControlsProps) {
  const handlePlayPause = useCallback(() => {
    if (playing) onPause?.();
    else onPlay?.();
  }, [playing, onPlay, onPause]);

  const handleSpeedClick = useCallback(() => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange?.(next);
  }, [speed, onSpeedChange]);

  const jumpSeconds = stepSeconds * 5;

  const ink = (primary?: boolean) => (primary ? "#fcfaf7" : "#2e2118");

  const IcoJumpBack = (c: string) => (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <polygon points="7,6 14,0 14,12" fill={c} />
      <polygon points="0,6 7,0 7,12" fill={c} />
    </svg>
  );
  const IcoStepBack = (c: string) => (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <polygon points="8,6 8,0 0,6 8,12" fill={c} />
    </svg>
  );
  const IcoPlay = (c: string) => (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
      <polygon points="0,0 9,6 0,12" fill={c} />
    </svg>
  );
  const IcoPause = (c: string) => (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <rect x="0" y="0" width="3.5" height="12" fill={c} rx="1" />
      <rect x="6.5" y="0" width="3.5" height="12" fill={c} rx="1" />
    </svg>
  );
  const IcoStepFwd = (c: string) => (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <polygon points="0,6 0,12 8,6 0,0" fill={c} />
    </svg>
  );
  const IcoJumpFwd = (c: string) => (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <polygon points="7,6 0,0 0,12" fill={c} />
      <polygon points="14,6 7,0 7,12" fill={c} />
    </svg>
  );

  const speedFmt = (s: PlaybackSpeed) =>
    s === 0.25 ? "0.25×" : s === 0.5 ? "0.5×" : `${s}×`;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 2,
        fontFamily: "'Caveat', cursive",
        ...style,
      }}
      className={className}
      role="group"
      aria-label="Playback controls"
    >
      <IconBtn label="Jump back" onClick={() => onJumpBack?.(-jumpSeconds)}>
        {IcoJumpBack(ink())}
      </IconBtn>

      <IconBtn label="Step back" onClick={() => onStepBack?.(-stepSeconds)}>
        {IcoStepBack(ink())}
      </IconBtn>

      <IconBtn
        label={playing ? "Pause" : "Play"}
        onClick={handlePlayPause}
        primary
      >
        {playing ? IcoPause(ink(true)) : IcoPlay(ink(true))}
        <span>{playing ? "Pause" : "Play"}</span>
      </IconBtn>

      <IconBtn
        label="Step forward"
        onClick={() => onStepForward?.(stepSeconds)}
      >
        {IcoStepFwd(ink())}
      </IconBtn>

      <IconBtn
        label="Jump forward"
        onClick={() => onJumpForward?.(jumpSeconds)}
      >
        {IcoJumpFwd(ink())}
      </IconBtn>

      <span
        style={{
          marginLeft: 8,
          color: "#5a4535",
          fontFamily: "'Caveat', cursive",
          fontSize: 14,
          cursor: "pointer",
          userSelect: "none",
          paddingTop: 1,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}
        onClick={handleSpeedClick}
        title="Click to cycle speed"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleSpeedClick()}
      >
        speed: {speedFmt(speed)}
      </span>
    </div>
  );
}

export default PlaybackControls;
