import { useDemoViewerViewModel } from "../../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Space, theme, Typography } from "antd";
import type {
  BombDefusedEventDto,
  BombExplodedEventDto,
  BombPlantedEventDto,
  KillEventDto,
} from "@demo-viewer/shared-types";
import { Paper } from "../../../components/Paper";

type LogAction = {
  onAction: (
    viewModel: ReturnType<typeof useDemoViewerViewModel>,
    e: any,
  ) => void;
};

type LogComponentProps = {
  onAction: () => void;
};

type LogComponent = ((props: object & LogComponentProps) => ReactNode) &
  LogAction;

export const EventLog = () => {
  const { token } = theme.useToken();
  const viewmodel = useDemoViewerViewModel();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<ReactNode[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    return viewmodel.subscribe((event, data) => {
      const logComponent = eventMap.get(event);

      if (logComponent) {
        const node = logComponent({
          ...data,
          onAction: () => logComponent.onAction(viewmodel, data),
        });
        setEntries((prev) => [...prev, node]);
      }
    });
  }, []);

  return (
    <Paper
      as={Space}
      className="h-full overflow-auto w-full border"
      orientation="vertical"
      size={4}
      style={{
        background: token.colorBgContainer,
      }}
    >
      <Typography className="sticky top-0 px-4 py-2">Event log</Typography>
      <div
        className="flex flex-col gap-2 px-4 py-2"
        style={{ background: token.colorBgContainer }}
      >
        {entries.map((e, index) => (
          <Fragment key={index}>{e}</Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </Paper>
  );
};

EventLog.BombDefusedLog = function (
  evt: BombDefusedEventDto & LogComponentProps,
) {
  return (
    <Typography onClick={evt.onAction}>
      💣 defused by {evt.data.player_name}
    </Typography>
  );
} as LogComponent;
EventLog.BombDefusedLog.onAction = (vm, e: BombDefusedEventDto) => {
  vm.jump(e.gameTick);
};

EventLog.BombExplodedLog = function (
  evt: BombExplodedEventDto & LogComponentProps,
) {
  return <Typography onClick={evt.onAction}>💥 at {evt.data.site}</Typography>;
} as LogComponent;
EventLog.BombExplodedLog.onAction = (vm, e: BombExplodedEventDto) => {
  vm.jump(e.gameTick);
};

EventLog.BombPlantedLog = function (
  evt: BombPlantedEventDto & LogComponentProps,
) {
  return (
    <Typography onClick={evt.onAction}>
      💣 planted at ${evt.data.site}
    </Typography>
  );
} as LogComponent;
EventLog.BombPlantedLog.onAction = (vm, e: BombPlantedEventDto) => {
  vm.jump(e.gameTick);
};

EventLog.KillLog = function (evt: KillEventDto & LogComponentProps) {
  return (
    <Typography onClick={evt.onAction}>
      {evt.data.killer_name} &gt; [{evt.data.weapon}] &gt;{" "}
      {evt.data.victim_name}
    </Typography>
  );
} as LogComponent;
EventLog.KillLog.onAction = (vm, e: KillEventDto) => {
  vm.jump(e.gameTick - vm.staticState.current.tickRate.ticksInSeconds(2));
};

EventLog.JumpLog = function (
  evt: { prev: number; new: number } & LogComponentProps,
) {
  return (
    <Typography className="font-bold" onClick={evt.onAction}>
      --- Jump to {evt.new} from {evt.prev} ---
    </Typography>
  );
} as LogComponent;
EventLog.JumpLog.onAction = (vm, e: { prev: number; new: number }) => {
  vm.jump(e.prev);
};

const eventMap = new Map<
  "kill" | "bomb_planted" | "bomb_exploded" | "bomb_defused" | "jump",
  LogComponent
>([
  ["kill", EventLog.KillLog],
  ["bomb_exploded", EventLog.BombExplodedLog],
  ["bomb_planted", EventLog.BombPlantedLog],
  ["bomb_defused", EventLog.BombDefusedLog],
  ["jump", EventLog.JumpLog],
]);
