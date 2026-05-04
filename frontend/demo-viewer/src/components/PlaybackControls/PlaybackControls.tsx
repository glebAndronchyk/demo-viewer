import { useCallback } from "react";
import { Button, Space } from "antd";

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

const IcoJumpBack = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
    <polygon points="7,6 14,0 14,12" fill="currentColor" />
    <polygon points="0,6 7,0 7,12" fill="currentColor" />
  </svg>
);

const IcoStepBack = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
    <polygon points="8,6 8,0 0,6 8,12" fill="currentColor" />
  </svg>
);

const IcoPlay = () => (
  <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
    <polygon points="0,0 9,6 0,12" fill="currentColor" />
  </svg>
);

const IcoPause = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
    <rect x="0" y="0" width="3.5" height="12" fill="currentColor" rx="1" />
    <rect x="6.5" y="0" width="3.5" height="12" fill="currentColor" rx="1" />
  </svg>
);

const IcoStepFwd = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
    <polygon points="0,6 0,12 8,6 0,0" fill="currentColor" />
  </svg>
);

const IcoJumpFwd = () => (
  <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
    <polygon points="7,6 0,0 0,12" fill="currentColor" />
    <polygon points="14,6 7,0 7,12" fill="currentColor" />
  </svg>
);

const speedFmt = (s: PlaybackSpeed) =>
  s === 0.25 ? "0.25×" : s === 0.5 ? "0.5×" : `${s}×`;

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

  return (
    <Space
      size={6}
      style={style}
      className={className}
      role="group"
      aria-label="Playback controls"
    >
      <Button
        icon={<IcoJumpBack />}
        aria-label="Jump back"
        onClick={() => onJumpBack?.(-jumpSeconds)}
      />
      <Button
        icon={<IcoStepBack />}
        aria-label="Step back"
        onClick={() => onStepBack?.(-stepSeconds)}
      />
      <Button
        type="primary"
        icon={playing ? <IcoPause /> : <IcoPlay />}
        onClick={handlePlayPause}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "Pause" : "Play"}
      </Button>
      <Button
        icon={<IcoStepFwd />}
        aria-label="Step forward"
        onClick={() => onStepForward?.(stepSeconds)}
      />
      <Button
        icon={<IcoJumpFwd />}
        aria-label="Jump forward"
        onClick={() => onJumpForward?.(jumpSeconds)}
      />
      <Button
        type="text"
        onClick={handleSpeedClick}
        title="Click to cycle speed"
        style={{ marginLeft: 2, color: "#5a4535" }}
      >
        speed: {speedFmt(speed)}
      </Button>
    </Space>
  );
}

export default PlaybackControls;
