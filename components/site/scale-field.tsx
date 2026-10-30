"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

/**
 * A sheet of iridescent dragon scales. A gold "spine" winds through it,
 * waves roll across it over time, and scales lift where the pointer passes.
 */

const INK = new THREE.Color("#232877");
const GLOW = new THREE.Color("#7c86ff");
const GOLD = new THREE.Color("#e9b949");

type Grid = { cols: number; rows: number };

function Scales({ grid, progress }: { grid: Grid; progress: RefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointer = useRef(new THREE.Vector2(99, 99));
  const lift = useRef<Float32Array>(new Float32Array(grid.cols * grid.rows));

  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    g.rotateX(Math.PI / 2);
    g.scale(1, 1.25, 0.32);
    return g;
  }, []);

  const cells = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        out.push({
          x: (c - grid.cols / 2) * 0.78 + (r % 2 ? 0.39 : 0),
          y: (grid.rows / 2 - r) * 0.5,
        });
      }
    }
    return out;
  }, [grid]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const color = new THREE.Color();
    cells.forEach(({ x, y }, i) => {
      const spine = Math.abs(y - Math.sin(x * 0.32) * 2.1);
      if (spine < 0.32) color.copy(GOLD);
      else color.copy(INK).lerp(GLOW, Math.min(1, Math.max(0, (y + 5) / 10)) * 0.75);
      m.setColorAt(i, color);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cells]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const g = group.current;
    if (!m || !g) return;
    const t = state.clock.elapsedTime;
    const p = progress.current ?? 0;

    // Wide screens: the sheet starts just right of centre so the headline sits on open ink.
    // Narrow screens: it fills the top of the hero, above the text.
    const wide = state.size.width >= 768;
    const s = wide ? 0.62 : 0.55;
    const halfWidth = (grid.cols / 2) * 0.78 * s;
    g.scale.setScalar(s);
    g.position.set(
      wide ? state.viewport.width * 0.04 + halfWidth : 0,
      (wide ? -0.4 : state.viewport.height * 0.24) + p * 2.4,
      0,
    );
    g.rotation.x = -0.62 - p * 0.5;
    g.rotation.z = 0.22 + p * 0.15;

    // Pointer in the sheet's rough local space (ignores the group's tilt, which is close enough).
    const vw = state.viewport.width / 2;
    const vh = state.viewport.height / 2;
    pointer.current.set((state.pointer.x * vw - g.position.x) / s, (state.pointer.y * vh - g.position.y) / s);

    const decay = Math.min(1, delta * 2.2);
    cells.forEach(({ x, y }, i) => {
      const dx = x - pointer.current.x;
      const dy = y - pointer.current.y;
      const near = Math.exp(-(dx * dx + dy * dy) * 0.22);
      lift.current[i] += (near - lift.current[i]) * decay;
      const wave = Math.sin(t * 0.9 + x * 0.34 + y * 0.55);
      const l = lift.current[i];

      dummy.position.set(x, y, wave * 0.14 + l * 0.55);
      dummy.rotation.set(-0.48 + wave * 0.16 + l * 0.85, 0, wave * 0.05);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, undefined, cells.length]}>
        <meshPhysicalMaterial
          metalness={0.35}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.2}
          iridescence={0.7}
          iridescenceIOR={1.4}
        />
      </instancedMesh>
    </group>
  );
}

export default function ScaleField({ progress }: { progress: RefObject<number> }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // Client-only component (loaded with ssr: false), so reading the window here is safe.
  const [grid] = useState<Grid>(() => (window.innerWidth < 768 ? { cols: 16, rows: 12 } : { cols: 24, rows: 28 }));

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0" aria-hidden>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 9], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[4, 6, 6]} intensity={1.8} />
        <pointLight position={[-2, -3, 4]} intensity={30} color="#7c86ff" />
        <pointLight position={[7, 4, 3]} intensity={26} color="#e9b949" />
        <Scales key={`${grid.cols}x${grid.rows}`} grid={grid} progress={progress} />
      </Canvas>
    </div>
  );
}
