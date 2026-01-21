import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  type Euler,
  useLoader,
  useThree,
  type Vector3,
} from "@react-three/fiber";
import {
  CameraHelper,
  DoubleSide,
  TextureLoader,
  OrthographicCamera as ThreeOrthographicCamera,
} from "three";
import {
  OrbitControls,
  OrthographicCamera,
  Plane,
  useHelper,
} from "@react-three/drei";

interface DebugThreeProps {
  orbit?: boolean;
  axes?: boolean;
  camera?: boolean;
}

interface GameAreaConfiguration {
  surfaceRotation: Euler;
  surfaceSize: [number, number];
  orthographicCameraPosition: Vector3;
  cameraZoom: number;
  frustumHeight: number;
}

const gameAreaConfiguration: GameAreaConfiguration = {
  surfaceRotation: [-Math.PI / 2, 0, 0], // horizontal plane
  surfaceSize: [256, 256], // 256x256 square
  orthographicCameraPosition: [0, 10, 0], // view from above on the plane
  cameraZoom: 30,
  frustumHeight: 10,
};

const DebugThree = (props: DebugThreeProps) => {
  const { orbit, camera, axes } = props;
  const { camera: sceneCamera } = useThree();

  useHelper(camera ? { current: sceneCamera } : null, CameraHelper);

  return (
    <>
      {orbit && <OrbitControls enableZoom />}
      {axes && <axesHelper args={[1000]} />}
    </>
  );
};

export default function DemoViewer() {
  return (
    <>
      <Canvas className="[&_canvas]:!w-[500px] [&_canvas]:!h-[500px]">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <DebugThree axes camera orbit />
      </Canvas>
    </>
  );
}

export const Scene = () => {
  const mapTexture = useLoader(
    TextureLoader,
    "assets/textures/maps/de_dust2.png",
  );
  // plain sizes should come accordingly to map bounds
  // apply scale factor to properly show on three js units

  const cameraRef = (camera: ThreeOrthographicCamera | null) => {
    if (!camera) return;

    const { surfaceSize, frustumHeight } = gameAreaConfiguration;

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
        position={gameAreaConfiguration.orthographicCameraPosition}
        zoom={gameAreaConfiguration.cameraZoom}
      />
      <ambientLight intensity={0.5} color="#ffffff" />

      <Plane
        args={gameAreaConfiguration.surfaceSize}
        rotation={gameAreaConfiguration.surfaceRotation}
      >
        <meshStandardMaterial side={DoubleSide} map={mapTexture} />
      </Plane>
    </>
  );
};
