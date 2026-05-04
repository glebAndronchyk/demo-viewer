import type { CSSProperties } from "react";
import { clsx } from "../../lib/clsx.ts";

interface RoundButtonProps {
  roundNumber: number;
  onClick: (roundNumber: number) => void;
  style?: CSSProperties;
  className?: string;
}

export const RoundButton = (props: RoundButtonProps) => {
  const { roundNumber, onClick, style, className } = props;

  return (
    <button
      onClick={() => onClick(roundNumber)}
      className={clsx("unset py-4 block border cursor-pointer", className)}
      style={{ ...style }}
    >
      {roundNumber}
    </button>
  );
};
