import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AerationTankTwinAsset, TwinAssetId } from "../../lib/twin/types";

interface WastewaterTwinProps {
  asset: AerationTankTwinAsset;
  selected: boolean;
  reducedMotion: boolean;
  theme: "light" | "dark";
  selectionColor: string;
  onSelectAsset: (assetId: TwinAssetId) => void;
}

interface BubbleSeed {
  x: number;
  z: number;
  offset: number;
  speed: number;
  scale: number;
}

const BUBBLE_SEEDS: readonly BubbleSeed[] = Array.from({ length: 20 }, (_, index) => ({
  x: -1.55 + ((index * 0.73) % 3.1),
  z: -1.08 + ((index * 0.47) % 2.16),
  offset: (index * 0.31) % 1,
  speed: 0.65 + (index % 4) * 0.12,
  scale: 0.035 + (index % 3) * 0.014,
}));

function BubbleField({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);

  const updateBubbles = useCallback(
    (elapsed: number) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      BUBBLE_SEEDS.forEach((seed, index) => {
        const progress = reducedMotion ? seed.offset : (seed.offset + elapsed * seed.speed) % 1;
        transform.position.set(seed.x, 0.3 + progress * 2.05, seed.z);
        transform.scale.setScalar(seed.scale);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    [reducedMotion, transform],
  );

  useEffect(() => updateBubbles(0), [updateBubbles]);
  useFrame(() => {
    if (!reducedMotion) updateBubbles(performance.now() / 1000);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUBBLE_SEEDS.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#dffcff" transparent opacity={0.72} />
    </instancedMesh>
  );
}

function SiteContext({ theme }: { theme: "light" | "dark" }) {
  const concrete = theme === "dark" ? "#183239" : "#d6ded8";
  const grass = theme === "dark" ? "#254a39" : "#6f966d";
  const hedge = theme === "dark" ? "#1c3f31" : "#557f59";

  return (
    <group>
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.14, 5.9]} />
        <meshStandardMaterial color={concrete} roughness={0.96} />
      </mesh>

      <mesh position={[0, -0.02, -2.72]}>
        <boxGeometry args={[7.7, 0.12, 0.42]} />
        <meshStandardMaterial color={grass} roughness={1} />
      </mesh>
      <mesh position={[-3.48, -0.02, 0]}>
        <boxGeometry args={[0.42, 0.12, 5.15]} />
        <meshStandardMaterial color={grass} roughness={1} />
      </mesh>

      {[-2.55, -1.65, -0.75, 0.15, 1.05, 1.95, 2.85].map((x) => (
        <mesh key={x} position={[x, 0.24, -2.9]}>
          <boxGeometry args={[0.72, 0.52, 0.42]} />
          <meshStandardMaterial color={hedge} roughness={0.98} />
        </mesh>
      ))}
    </group>
  );
}

function SitePipe({ theme }: { theme: "light" | "dark" }) {
  const pipeColor = theme === "dark" ? "#22a7a7" : "#21a6a0";

  return (
    <group>
      <mesh position={[-2.55, 1.45, -0.72]}>
        <cylinderGeometry args={[0.11, 0.11, 2.65, 16]} />
        <meshStandardMaterial color={pipeColor} roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[-1.7, 2.76, -0.72]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 1.72, 16]} />
        <meshStandardMaterial color={pipeColor} roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[-0.86, 2.48, -0.72]}>
        <cylinderGeometry args={[0.11, 0.11, 0.58, 16]} />
        <meshStandardMaterial color={pipeColor} roughness={0.5} metalness={0.08} />
      </mesh>
    </group>
  );
}

function SiteLadder() {
  const railColor = "#c9493f";

  return (
    <group position={[-1.25, 1.42, 1.78]}>
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.07, 2.5, 0.08]} />
        <meshStandardMaterial color={railColor} roughness={0.62} />
      </mesh>
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.07, 2.5, 0.08]} />
        <meshStandardMaterial color={railColor} roughness={0.62} />
      </mesh>
      {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.46, 0.055, 0.075]} />
          <meshStandardMaterial color={railColor} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}

function SiteSign({ theme }: { theme: "light" | "dark" }) {
  return (
    <group position={[0.95, 1.82, 1.79]}>
      <mesh>
        <boxGeometry args={[0.86, 0.46, 0.055]} />
        <meshStandardMaterial color={theme === "dark" ? "#245a8c" : "#397bb0"} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[0.54, 0.055, 0.015]} />
        <meshBasicMaterial color="#dbeefa" />
      </mesh>
    </group>
  );
}

export function WastewaterTwin({
  asset,
  selected,
  reducedMotion,
  theme,
  selectionColor,
  onSelectAsset,
}: WastewaterTwinProps) {
  const level = asset.waterLevelPercent.value;
  const waterHeight = level === null ? null : Math.max(0, Math.min(1, level / 100)) * 2.3;
  const wallColor = theme === "dark" ? "#647a7c" : "#aebbb4";
  const wallTopColor = theme === "dark" ? "#7f9090" : "#c3ccc5";
  const basinFloorColor = theme === "dark" ? "#0b252a" : "#c8d4cf";
  const waterColor = theme === "dark" ? "#155866" : "#287f8c";

  const selectionOutlineGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(5.05, 3.2, 3.85);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);

  useEffect(() => () => selectionOutlineGeometry.dispose(), [selectionOutlineGeometry]);

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelectAsset(asset.id);
      }}
    >
      <SiteContext theme={theme} />

      <group position={[0.15, 0, 0.05]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[4.7, 0.22, 3.45]} />
          <meshStandardMaterial color={basinFloorColor} roughness={0.94} />
        </mesh>

        <mesh position={[-2.28, 1.42, 0]}>
          <boxGeometry args={[0.22, 2.82, 3.45]} />
          <meshStandardMaterial color={wallColor} roughness={0.86} />
        </mesh>
        <mesh position={[2.28, 1.42, 0]}>
          <boxGeometry args={[0.22, 2.82, 3.45]} />
          <meshStandardMaterial color={wallColor} roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.42, -1.62]}>
          <boxGeometry args={[4.78, 2.82, 0.22]} />
          <meshStandardMaterial color={wallColor} roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.42, 1.62]}>
          <boxGeometry args={[4.78, 2.82, 0.22]} />
          <meshStandardMaterial color={wallColor} roughness={0.86} />
        </mesh>

        <mesh position={[-2.28, 2.84, 0]}>
          <boxGeometry args={[0.3, 0.12, 3.62]} />
          <meshStandardMaterial color={wallTopColor} roughness={0.82} />
        </mesh>
        <mesh position={[2.28, 2.84, 0]}>
          <boxGeometry args={[0.3, 0.12, 3.62]} />
          <meshStandardMaterial color={wallTopColor} roughness={0.82} />
        </mesh>
        <mesh position={[0, 2.84, -1.62]}>
          <boxGeometry args={[4.82, 0.12, 0.3]} />
          <meshStandardMaterial color={wallTopColor} roughness={0.82} />
        </mesh>
        <mesh position={[0, 2.84, 1.62]}>
          <boxGeometry args={[4.82, 0.12, 0.3]} />
          <meshStandardMaterial color={wallTopColor} roughness={0.82} />
        </mesh>

        {waterHeight !== null && waterHeight > 0 ? (
          <group>
            <mesh position={[0, 0.22 + waterHeight / 2, 0]}>
              <boxGeometry args={[4.28, waterHeight, 3.0]} />
              <meshStandardMaterial color={waterColor} roughness={0.5} transparent opacity={0.72} />
            </mesh>
            <mesh position={[0, 0.22 + waterHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4.24, 2.96, 1, 1]} />
              <meshStandardMaterial color={waterColor} roughness={0.4} metalness={0.02} />
            </mesh>
          </group>
        ) : null}

        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.74, 0.74, 0.14, 24]} />
          <meshStandardMaterial color={theme === "dark" ? "#24474d" : "#78908b"} roughness={0.72} />
        </mesh>

        {asset.aeratorRunning.value === true ? <BubbleField reducedMotion={reducedMotion} /> : null}

        <SitePipe theme={theme} />
        <SiteLadder />
        <SiteSign theme={theme} />
      </group>

      {selected ? (
        <lineSegments position={[0.15, 1.48, 0.05]}>
          <primitive object={selectionOutlineGeometry} attach="geometry" />
          <lineBasicMaterial color={selectionColor} transparent opacity={0.9} />
        </lineSegments>
      ) : null}
    </group>
  );
}
