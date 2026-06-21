import {
  type CSSProperties,
  type ElementType,
  type ComponentPropsWithoutRef,
  useMemo,
} from "react";
import { theme } from "antd";

type PaperProps<C extends ElementType = "div"> = {
  as?: C;
  minStretchPoints?: number;
  maxStretchPoints?: number;
} & ComponentPropsWithoutRef<C>;

const randomRange = (min: number, max: number) =>
  Math.abs(Math.random() * (max - min)) + min;
const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

export const Paper = <C extends ElementType = "div">(props: PaperProps<C>) => {
  const { token } = theme.useToken();
  const { as, ...rest } = props;
  const Component = (as ?? "div") as ElementType;
  const paperBorders = useMemo(() => {
    const stretchPoints = 16;
    const pointsPerSide = Math.sqrt(stretchPoints);

    const { t: entries } = Array.from({ length: stretchPoints }).reduce<{
      dir: 0 | 1 | 2 | 3;
      prevCoords: [number, number, number, number];
      t: string[];
    }>(
      (acc, _, i) => {
        acc.dir = Math.floor(i / pointsPerSide) as 0 | 1 | 2 | 3;
        const distribution = ((i / pointsPerSide) % 1) * 100;

        // horizontal
        if (acc.dir === 0 || acc.dir === 2) {
          const sign = acc.dir === 0 ? 1 : -1;

          const now = acc.prevCoords[0];
          const next =
            sign > 0
              ? randomRange(now, clamp(now + distribution, 0, 100))
              : randomRange(clamp(now - distribution, 0, 100), now);
          const controlX =
            sign > 0 ? randomRange(now, next) : randomRange(next, now);
          const controlY =
            sign > 0 ? randomRange(1, 2.5) : randomRange(98, 99.5);

          acc.prevCoords[0] = next;
          acc.prevCoords[1] = sign > 0 ? 0 : 100; // top or bottom edge
          acc.prevCoords[2] = controlX;
          acc.prevCoords[3] = controlY;
        }

        // vertical
        if (acc.dir === 1 || acc.dir === 3) {
          const sign = acc.dir === 1 ? 1 : -1;

          const now = acc.prevCoords[1];
          const next =
            sign > 0
              ? randomRange(now, clamp(now + distribution, 0, 100))
              : randomRange(clamp(now - distribution, 0, 100), now);
          const controlY =
            sign > 0 ? randomRange(now, next) : randomRange(next, now);
          const controlX =
            sign > 0 ? randomRange(99, 99.5) : randomRange(0.5, 1);

          acc.prevCoords[2] = controlX;
          acc.prevCoords[3] = controlY;
          acc.prevCoords[0] = sign > 0 ? 100 : 0; // left or right
          acc.prevCoords[1] = next;
        }

        acc.t.push(
          `smooth to ${acc.prevCoords[0]}% ${acc.prevCoords[1]}% with ${acc.prevCoords[2]}% ${acc.prevCoords[3]}%`,
        );

        return acc;
      },
      {
        dir: 0, // 0,1,2,3
        prevCoords: [0, 0, 0, 0],
        t: [],
      },
    );

    entries.push("smooth to 0% 0%");

    return {
      borderShape: `shape(from 0 0, ${entries.join(",")})`,
    } satisfies CSSProperties & { borderShape: string };
  }, [props.maxStretchPoints, props.minStretchPoints]);

  const { style, ...restWithoutStyle } = rest as {
    style?: CSSProperties;
  } & Record<string, unknown>;
  const AnyComponent = Component as "div";

  return (
    <AnyComponent
      {...(restWithoutStyle as object)}
      style={{
        ...(paperBorders as CSSProperties),
        borderColor: token.colorBorder,
        ...style,
      }}
    />
  );
};
