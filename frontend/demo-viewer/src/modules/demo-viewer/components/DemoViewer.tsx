import { Suspense, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  CameraHelper,
  DoubleSide,
  OrthographicCamera as ThreeOrthographicCamera,
} from "three";

import {
  Html,
  OrbitControls,
  OrthographicCamera,
  Plane,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { Button, Segmented, Typography } from "antd";
import {
  DemoViewerViewModel,
  useDemoViewerViewModel,
} from "../viewmodel/DemoViewerViewModel";
import { useViewerState } from "../hooks/useViewerState";

const SPEED_OPTIONS = [
  { label: "0.25×", value: 0.25 },
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
];

interface DebugThreeProps {
  orbit?: boolean;
  axes?: boolean;
  camera?: boolean;
  controls?: boolean;
}

const DebugThree = (props: DebugThreeProps) => {
  const { orbit, camera, axes, controls } = props;
  const { camera: sceneCamera } = useThree();
  const vm = useDemoViewerViewModel();
  const { currentTick, finalBufferedTick, speed, playbackState } =
    useViewerState(vm);

  useHelper(camera ? { current: sceneCamera } : null, CameraHelper);

  return (
    <>
      {orbit && <OrbitControls enableZoom />}
      {axes && <axesHelper args={[1000]} />}
      {controls && (
        <Html
          transform={false}
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "0",
            width: "500px",
            pointerEvents: "auto",
          }}
          zIndexRange={[0, 0]}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "8px 12px",
              background: "rgba(0,0,0,0.75)",
              borderRadius: "0 0 6px 6px",
            }}
          >
            <Typography.Text style={{ color: "#fff", fontSize: 12 }}>
              Tick: {currentTick} / {finalBufferedTick}
            </Typography.Text>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  playbackState === "play" ? vm.pause() : vm.play()
                }
              >
                {playbackState === "play" ? "Pause" : "Play"}
              </Button>
              <Segmented
                size="small"
                options={SPEED_OPTIONS}
                value={speed}
                onChange={(v) => vm.speed(Number(v))}
              />
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

export default function DemoViewer() {
  return (
    <Canvas className="[&_canvas]:!w-[500px] [&_canvas]:!h-[500px]">
      <DemoViewerViewModel>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <DebugThree axes camera orbit controls />
      </DemoViewerViewModel>
    </Canvas>
  );
}

export const Scene = () => {
  const { applyScene, matchData, staticState } = useDemoViewerViewModel();

  const { scene } = useThree();

  useLayoutEffect(() => {
    applyScene(scene);
  }, [scene]);

  const mapTexture = useTexture(matchData.mapRadarLayers["0"]);
  // plain sizes should come accordingly to map bounds
  // apply scale factor to properly show on three js units

  const {
    surfaceSize,
    frustumHeight,
    orthographicCameraPosition,
    cameraZoom,
    surfaceRotation,
  } = staticState.current.playground.config;

  const cameraRef = (camera: ThreeOrthographicCamera | null) => {
    if (!camera) return;

    const aspectRatio = surfaceSize[0] / surfaceSize[1];
    const frustumWidth = frustumHeight * aspectRatio;
    const halfWidth = frustumWidth / 2;
    const halfHeight = frustumHeight / 2;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.zoom = frustumHeight / surfaceSize[1];

    camera.updateProjectionMatrix();
  };

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={orthographicCameraPosition}
        zoom={cameraZoom}
      />
      <ambientLight intensity={0.5} color="#ffffff" />

      <Plane args={surfaceSize} rotation={surfaceRotation}>
        <meshBasicMaterial side={DoubleSide} map={mapTexture} />
      </Plane>
    </>
  );
};
