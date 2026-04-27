import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Mesh, Scene } from "three";
import { PlayerPawnMesh } from "../entities/PlayerPawnMesh.ts";
import type { FrameDto, SeekResponseDto } from "@demo-viewer/shared-types";
import { useFrame } from "@react-three/fiber";
import { DemoCache } from "../entities/DemoCache.ts";
import { Tick } from "@demo-viewer/shared-entities";

const useDemoViewer = () => {
  // #region types

  interface ViewerState {
    finalBufferedTick: number;
    currentTick: number;
    speed: number;
    bufferingWindow: number;
    tickRate: Tick;
    state: "pause" | "play";
    geometries: Map<string, Mesh>;
  }

  type StateConsumer = (event: string, data: object) => void;

  // #endregion
  // #region variables

  // todo single class
  const bufferingWindow = Tick.rate(64).ticksInSeconds(10);

  const [scene, _setScene] = useState<Scene>(null as never);
  const _cache = useRef(
    new DemoCache(new Map<number, FrameDto>(), {}, bufferingWindow),
  );
  const _isLooping = useRef(false);
  const _tickAccumulator = useRef(0);
  const _listeners = useRef<Set<StateConsumer>>(new Set());
  const staticState = useRef<ViewerState>({
    geometries: new Map(),
    currentTick: 0,
    finalBufferedTick: 0,
    speed: 1,
    tickRate: Tick.rate(64),
    bufferingWindow,
    state: "pause",
  });

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

  const subscribe = (consumer: StateConsumer) => {
    _listeners.current.add(consumer);
  };

  const unsubscribe = (consumer: StateConsumer) => {
    _listeners.current.delete(consumer);
  };

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
    return structuredClone(staticState.current); // todo fix geometries clonning
  };

  const _notify = (...args: Parameters<StateConsumer>) => {
    const [event, data] = args;

    _listeners.current.forEach((l) => l(event, data));
  };

  const _bufferDemo = async (forceStartTick?: number) => {
    // todo deal with _l2Cache
    const startTick = forceStartTick || staticState.current.currentTick;

    const cachedCurrentFrame = await _cache.current.getByTick(
      startTick + staticState.current.tickRate.oneSecond(),
    );

    if (cachedCurrentFrame) {
      if (
        staticState.current.finalBufferedTick - startTick <
        staticState.current.finalBufferedTick * (1 / 4) // 25% of staticState.current.finalBufferedTick
      ) {
        // delegate to service worker
        _pollFrames()
          .then((r) => _cache.current.store(r))
          .then((cache) => {
            staticState.current.finalBufferedTick =
              cache.l1GetFinalAvailableFrame().gameTick;
          });
      }

      staticState.current.currentTick = cachedCurrentFrame.gameTick;

      return { frame: cachedCurrentFrame };
    }

    await _cache.current.store(await _pollFrames());
    const currentFrame = await _cache.current.getByTick(startTick);

    if (!currentFrame) {
      throw new Error(`Requested tick:${startTick} is not in range`);
    }

    staticState.current.currentTick = currentFrame.gameTick;
    staticState.current.finalBufferedTick =
      _cache.current.l1GetFinalAvailableFrame().gameTick;

    return {
      frame: currentFrame,
    };
  };

  const _pollFrames = async () => {
    const params = new URLSearchParams();
    params.set("startGameTick", String(staticState.current.finalBufferedTick));
    params.set(
      "endGameTick",
      String(staticState.current.finalBufferedTick + bufferingWindow),
    );
    params.set("step", String(64)); // todo: based on demo tickrate

    // todo: better error handling -- frame failed to load, and loop breaks (occurs on init when startTick = 0)
    const framesResult = await fetch(
      `http://localhost:3000/streaming/player/seek/69ea17924a40f3efe7effee7?${params.toString()}`,
    )
      .then((r) => r.json())
      .then((r) => (r as SeekResponseDto).data)
      .catch(() => [] as FrameDto[]);

    return Promise.resolve(framesResult);
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

  // #endregion
  // #region operation

  useFrame((_, delta) => {
    if (staticState.current.state !== "play" || _isLooping.current) return;

    const tickInterval = 1 / staticState.current.speed;
    _tickAccumulator.current += delta * staticState.current.speed;

    if (_tickAccumulator.current >= tickInterval) {
      _tickAccumulator.current -= tickInterval;
      _isLooping.current = true;
      loop().finally(() => {
        _isLooping.current = false;
      });
    }
  });

  useEffect(() => {
    setTimeout(() => {
      play();
    }, 3000);
  }, []);

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
