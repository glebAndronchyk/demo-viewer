import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";
import { type Line, Mesh, Scene } from "three";
import { PlayerPawn } from "../entities/PlayerPawn.ts";
import { Bomb } from "../entities/Bomb.ts";
import {
  GRENADE_WEAPON_TYPES,
  MELEE_AND_EQUIPMENT_WEAPON_TYPES,
} from "@demo-viewer/shared-types";
import type {
  FrameDto,
  ManifestResponseDto,
  SeekResponseDto,
} from "@demo-viewer/shared-types";
import { useFrame } from "@react-three/fiber";
import { DemoCache } from "../entities/DemoCache.ts";
import { Tick } from "@demo-viewer/shared-entities";
import { useLoaderData } from "react-router";
import { PlaygroundConfiguration } from "../entities/PlaygroundConfiguration.ts";
import type { ViewerState } from "../types/ViewerState.ts";
import { type Animatable, isAnimatableInterface } from "../types/Animatable.ts";
import { PlayerTextureAtlas } from "../entities/PlayerTextureAtlas.ts";

const useDemoViewer = () => {
  // #region types

  type StateConsumer = (event: string, data: object) => void;

  // #endregion
  // #region variables

  const matchData =
    useLoaderData<
      Awaited<ReturnType<typeof useDemoViewerViewModel.matchManifestLoader>>
    >();

  // todo single class
  const bufferingWindow = Tick.rate(
    matchData.matchManifest.tickRate,
  ).ticksInSeconds(10);

  const [scene, _setScene] = useState<Scene>(null as never);
  const _cache = useRef(
    new DemoCache(new Map<number, FrameDto>(), {}, bufferingWindow),
  );
  const _listeners = useRef<Set<StateConsumer>>(new Set());
  const staticState = useRef<ViewerState>({
    geometries: new Map(),
    currentTick: 0,
    finalBufferedTick: 0,
    speed: 1,
    tickRate: Tick.rate(matchData.matchManifest.tickRate),
    bufferingWindow,
    state: "pause",
    get crossTracerDelay() {
      return this.tickRate.updateRate + this.tickRate.ticksInSeconds(0.2);
    },
    playground: new PlaygroundConfiguration({
      // todo: from map manifest
      surfaceRotation: [-Math.PI / 2, 0, 0], // horizontal plane
      surfaceSize: [1024, 1024], // 1024x1024 square
      orthographicCameraPosition: [0, 10, 0], // view from above on the plane
      cameraZoom: 30,
      frustumHeight: 10,
      mapResolution: 5.02,
      mapOriginOffset: {
        x: 3240,
        y: 3410,
      },
    }),
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
    staticState.current.state = "play";
    _notify("play", {
      snapshot: _snapshot(),
    });
  };

  const pause = async () => {
    const { frame } = await _bufferDemo();

    staticState.current.state = "pause";
    _notify("pause", {
      snapshot: _snapshot(),
      frame,
    });
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
    _notify("speed", { speed: v });
  };

  const subscribe = (consumer: StateConsumer) => {
    _listeners.current.add(consumer);

    return () => unsubscribe(consumer);
  };

  const unsubscribe = (consumer: StateConsumer) => {
    _listeners.current.delete(consumer);
  };

  const applyScene = (scene: Scene) => _setScene(scene);

  // #endregion
  // #region private

  const _drawFrame = (frame: FrameDto) => {
    frame.events
      .sort((e) => e.gameTick)
      .forEach((evt) => {
        switch (evt.type) {
          case "player_connect":
            addGeometry(
              evt.data.steam_id_64,
              PlayerPawn.join(
                staticState.current.playground,
                matchData.playerTextureAtlas,
              ),
            );
            break;
          case "player_disconnect":
            destroyGeometry(evt.data.steam_id_64);
            break;
          case "weapon_fire": {
            // TODO: per-weapon-type tracer styling (color, length, etc.)
            if (
              GRENADE_WEAPON_TYPES.includes(evt.data.weapon) ||
              MELEE_AND_EQUIPMENT_WEAPON_TYPES.includes(evt.data.weapon)
            )
              break;
            const shooter = getGeometry<PlayerPawn>(
              evt.data.shooter_steam_id_64,
            );
            const tracer = shooter?.shot(
              evt,
              staticState.current.crossTracerDelay,
            );
            addGeometry(crypto.randomUUID(), tracer);
            break;
          }
          case "kill": {
            const victimGeometry = getGeometry<PlayerPawn>(
              evt.data.victim_steam_id_64,
            );

            victimGeometry?.die(evt, staticState.current.crossTracerDelay); // apply cross tracer delay for proper scheduling the event
            break;
          }
          case "bomb_planted": {
            const planterState = frame.playerStates.find(
              (p) => p.steamId64 === evt.data.player_steam_id_64,
            );
            if (!planterState) break;

            addGeometry(
              "bomb",
              Bomb.create(
                staticState.current.playground,
                planterState.position,
              ),
            );
            break;
          }
          case "bomb_defused":
            destroyGeometry("bomb");
            break;
          case "bomb_exploded":
            destroyGeometry("bomb");
            break;
          case "round_freezetime_end":
            staticState.current.geometries.forEach((g) => {
              if (g instanceof PlayerPawn) {
                g.resurrect();
              }
            });
            destroyGeometry("bomb");
            break;
          case "round_start":
            staticState.current.geometries.forEach((g) => {
              if (g instanceof PlayerPawn) {
                g.resurrect();
              }
            });
            destroyGeometry("bomb");
            break;
        }

        _notify(evt.type, evt);
      });

    frame.playerStates.forEach((player) => {
      const mesh = staticState.current.geometries.get(player.steamId64);

      if (!(mesh instanceof PlayerPawn)) return;

      mesh.teamSwitch(player);
      mesh.move(player.position);
    });
  };

  const _snapshot = () => {
    // return structuredClone(staticState.current); // todo fix geometries clonning
    return {} as never;
  };

  const _notify = (...args: Parameters<StateConsumer>) => {
    const [event, data] = args;
    _listeners.current.forEach((l) => l(event, data));
  };

  const _bufferDemo = async (forceStartTick?: number) => {
    // todo deal with _l2Cache
    const startTick = forceStartTick || staticState.current.currentTick;
    console.log(startTick);
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
    const frameTick = Math.max(
      0,
      startTick - staticState.current.tickRate.oneSecond(),
    );
    const currentFrame =
      (await _cache.current.getByTick(frameTick)) ??
      _cache.current.l1GetFirstAvailableFrame();

    if (!currentFrame) {
      throw new Error(`Requested tick:${frameTick} is not in range`);
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
    params.set("step", String(matchData.matchManifest.tickRate)); // todo: based on demo tickrate

    // todo: better error handling -- frame failed to load, and loop breaks (occurs on init when startTick = 0)
    const framesResult = await fetch(
      `http://localhost:3000/streaming/player/seek/69f27c4cb7b6acee7e74bfb7?${params.toString()}`,
    )
      .then((r) => r.json())
      .then((r) => (r as SeekResponseDto).data)
      .catch(() => [] as FrameDto[]);

    return Promise.resolve(framesResult);
  };

  const addGeometry = <T extends Animatable & (Mesh | Line)>(
    key: string,
    geom: T | null | undefined,
  ) => {
    if (!geom || staticState.current.geometries.has(key)) return;
    staticState.current.geometries.set(key, geom);
    scene.add(geom);

    return geom;
  };

  const getGeometry = <T extends Animatable & Mesh>(
    key: string | null,
  ): T | null => {
    if (!key) return null;

    return staticState.current.geometries.get(key) as T;
  };

  const destroyGeometry = (key: string) => {
    const geom = staticState.current.geometries.get(key);
    if (!geom) return;

    staticState.current.geometries.delete(key);
    scene.remove(geom);
  };

  // #endregion

  return {
    staticState,
    matchData,
    play,
    speed,
    jump,
    pause,
    subscribe,
    unsubscribe,
    loop,
    applyScene,
    addGeometry,
    getGeometry,
    destroyGeometry,
  };
};

const DemoViewerViewModelContext = createContext<
  ReturnType<typeof useDemoViewer>
>(null as never);

// eslint-disable-next-line react-refresh/only-export-components
export const useDemoViewerViewModel = () => {
  return useContext(DemoViewerViewModelContext);
};

/**
 * Loader to get the initial map data
 */
useDemoViewerViewModel.matchManifestLoader = async () => {
  const matchManifestPromise = fetch(
    `http://localhost:3000/streaming/player/manifest/69f27c4cb7b6acee7e74bfb7`,
  )
    .then((r) => r.json())
    .then((r) => (r as ManifestResponseDto).data)
    .catch(() => null);

  const playerTextureAtlasPromise = PlayerTextureAtlas.create();

  const [matchManifest, playerTextureAtlas] = await Promise.all([
    matchManifestPromise,
    playerTextureAtlasPromise,
  ]);
  if (!matchManifest || !playerTextureAtlas)
    throw new Error("Failed to load match manifest"); // todo

  return {
    matchManifest,
    playerTextureAtlas,
  };
};

export const DemoViewerViewModel = (props: PropsWithChildren) => {
  const vm = useDemoViewer();

  return (
    <DemoViewerViewModelContext.Provider value={vm}>
      {props.children}
    </DemoViewerViewModelContext.Provider>
  );
};

/**
 * Component to start main game loop
 */
export const FrameOperator = () => {
  const { staticState, loop, destroyGeometry } = useDemoViewerViewModel();
  const _isLooping = useRef(false);
  const _tickAccumulator = useRef(0);

  /**
   * Main viewer loop
   */
  useFrame((_, delta) => {
    const tickInterval = 1 / staticState.current.speed; // ticks received in 1s format
    const singleTickInterval =
      1 / (staticState.current.tickRate.updateRate * staticState.current.speed); // time of single game tick accoingly to specified speed
    const currentGameTick =
      staticState.current.currentTick +
      Math.floor(_tickAccumulator.current / singleTickInterval);

    // animate geometries
    staticState.current.geometries.forEach((geom, key) => {
      if (isAnimatableInterface(geom)) {
        geom.isAnimatable(currentGameTick)?.animate(delta, tickInterval);
        geom.timing(currentGameTick);
        if (geom.shouldDestroy) {
          destroyGeometry(key);
        }
      }
    });

    if (staticState.current.state !== "play" || _isLooping.current) return;

    _tickAccumulator.current += delta * staticState.current.speed;

    // start buffering loop
    if (_tickAccumulator.current >= tickInterval) {
      _tickAccumulator.current -= tickInterval;
      _isLooping.current = true;
      loop().finally(() => {
        _isLooping.current = false;
      });
    }
  });

  return <></>;
};
