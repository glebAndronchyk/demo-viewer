import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";
import { Mesh, Scene } from "three";
import { PlayerPawnMesh } from "../entities/PlayerPawnMesh.ts";
import type { FrameDto } from "@demo-viewer/shared-types";

const useDemoViewer = () => {
  // #region types

  interface ViewerState {
    finalBufferedTick: number;
    currentTick: number;
    speed: number;
    state: "pause" | "play";
    geometries: Map<string, Mesh>;
  }

  type StateConsumer = (event: string, data: object) => void;

  // #endregion
  // #region variables

  const [scene, _setScene] = useState<Scene>(null as never);
  const _listeners = useRef<Set<StateConsumer>>(new Set());
  const _l1Cache = useRef(new Map<string, number>());
  const staticState = useRef<ViewerState>({
    geometries: new Map(),
    currentTick: 0,
    finalBufferedTick: 0,
    speed: 1,
    state: "play",
  });
  const _idb = {} as never;

  // #endregion
  // #region public

  const loop = async () => {
    const { frame } = await _bufferDemo();

    _drawFrame(frame);
    _notify("tick", {
      snapshot: _snapshot(),
      frame,
    });
  };

  const play = async () => {
    const { frame } = await _bufferDemo();

    _notify("play", {
      snapshot: _snapshot(),
      frame,
    });
    staticState.current.state = "play";
  };

  const pause = async () => {
    const { frame } = await _bufferDemo();

    _notify("pause", {
      snapshot: _snapshot(),
      frame,
    });
    staticState.current.state = "pause";
  };

  const jump = async (tick: number) => {
    const { frame } = await _bufferDemo(tick);

    _notify("jump", {
      snapshot: _snapshot(),
      frame,
    });
  };

  const speed = (v: number) => {
    staticState.current.speed = v;
  };

  const subscribe = () => {};

  const unsubscribe = () => {};

  const applyScene = (scene: Scene) => _setScene(scene);

  // #endregion
  // #region private

  const _drawFrame = (frame: FrameDto) => {
    frame.events.forEach((evt) => {
      switch (evt.type) {
        case "player_connect":
          return _addGeometry(evt.data.steam_id_64, new PlayerPawnMesh());
        case "player_disconnect":
          return _destroyGeometry(evt.data.steam_id_64);
      }

      _notify(evt.type, evt.data);
    });

    frame.playerStates.forEach((player) => {
      const mesh = staticState.current.geometries.get(player.steamId64);

      if (!(mesh instanceof PlayerPawnMesh)) {
        throw new Error(
          `Tried to update player:${player.steamId64} that is not PlayerPawnMesh`,
        );
      }

      mesh.move(player);
    });
  };

  const _snapshot = () => {
    return structuredClone(staticState.current);
  };

  const _notify = (...args: Parameters<StateConsumer>) => {
    const [event, data] = args;

    _listeners.current.forEach((l) => l(event, data));
  };

  const _bufferDemo = (startTick?: number) => {
    return Promise.resolve({
      frame: {} as never as FrameDto,
    });
  };

  const _addGeometry = (key: string, geom: Mesh) => {
    staticState.current.geometries.set(key, geom);
    scene.add(geom);
  };

  const _destroyGeometry = (key: string) => {
    const geom = staticState.current.geometries.get(key);
    if (!geom) return;

    staticState.current.geometries.delete(key);
    scene.remove(geom);
  };

  const _updateL1Cache = () => {};

  const _updateL2Cache = () => {};

  const _invalidateL1Cache = () => {};

  const _invalidateL2Cache = () => {};

  // #endregion

  return {
    staticState,
    play,
    speed,
    jump,
    pause,
    subscribe,
    unsubscribe,
    loop,
    applyScene,
  };
};

const DemoViewerViewModelContext = createContext<
  ReturnType<typeof useDemoViewer>
>(null as never);

// eslint-disable-next-line react-refresh/only-export-components
export const useDemoViewerViewModel = () => {
  return useContext(DemoViewerViewModelContext);
};

export const DemoViewerViewModel = (props: PropsWithChildren) => {
  const vm = useDemoViewer();

  return (
    <DemoViewerViewModelContext.Provider value={vm}>
      {props.children}
    </DemoViewerViewModelContext.Provider>
  );
};
