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
  x: -1.45 + ((index * 0.73) % 2.9),
  z: -0.95 + ((index * 0.47) % 1.9),
  offset: (index * 0.31) % 1,
  speed: 0.65 + (index % 4) * 0.12,
  scale: 0.035 + (index % 3) * 0.014,
}));

function BubbleField({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);

  const updateBubbles = useCallback((elapsed: number) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    BUBBLE_SEEDS.forEach((seed, index) => {
      const progress = reducedMotion ? seed.offset : (seed.offset + elapsed * seed.speed) % 1;
      transform.position.set(seed.x, 0.22 + progress * 1.9, seed.z);
      transform.scale.setScalar(seed.scale);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [reducedMotion, transform]);

  useEffect(() => updateBubbles(0), [updateBubbles]);
  useFrame(() => {
    if (!reducedMotion) updateBubbles(performance.now() / 1000);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUBBLE_SEEDS.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#dffcff" transparent opacity={0.8} />
    </instancedMesh>
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
  const waterHeight = level === null ? null : Math.max(0, Math.min(1, level / 100)) * 2.05;
  const wallColor = theme === "dark" ? "#557176" : "#a3b9b5";
  const floorColor = theme === "dark" ? "#0a2429" : "#dbe8e3";
  const selectionOutlineGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(4.45, 2.55, 3.45);
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
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[4.2, 0.16, 3.2]} />
        <meshStandardMaterial color={floorColor} roughness={0.88} />
      </mesh>

      <mesh position={[-2.05, 1.15, 0]}>
        <boxGeometry args={[0.18, 2.3, 3.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.78} />
      </mesh>
      <mesh position={[2.05, 1.15, 0]}>
        <boxGeometry args={[0.18, 2.3, 3.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.15, -1.5]}>
        <boxGeometry args={[4.1, 2.3, 0.18]} />
        <meshStandardMaterial color={wallColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.15, 1.5]}>
        <boxGeometry args={[4.1, 2.3, 0.18]} />
        <meshStandardMaterial color={wallColor} roughness={0.78} transparent opacity={0.48} />
      </mesh>

      {waterHeight !== null && waterHeight > 0 ? (
        <mesh position={[0, 0.16 + waterHeight / 2, 0]}>
          <boxGeometry args={[3.84, waterHeight, 2.82]} />
          <meshStandardMaterial
            color="#1689a3"
            transparent
            opacity={0.48}
            roughness={0.2}
            metalness={0.05}
          />
        </mesh>
      ) : null}

      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.14, 24]} />
        <meshStandardMaterial color="#1f4c55" roughness={0.65} />
      </mesh>

      {asset.aeratorRunning.value === true ? (
        <BubbleField reducedMotion={reducedMotion} />
      ) : null}

      {selected ? (
        <lineSegments position={[0, 1.15, 0]}>
          <primitive object={selectionOutlineGeometry} attach="geometry" />
          <lineBasicMaterial color={selectionColor} transparent opacity={0.9} />
        </lineSegments>
      ) : null}
    </group>
  );
}
