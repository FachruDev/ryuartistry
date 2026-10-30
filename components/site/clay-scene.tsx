"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

// 3D simplex noise — Ashima Arts / Stefan Gustavson (MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const PALETTE = ["#cdbcff", "#b8ecd8", "#bcdcff", "#ffcdb8"].map((c) => new THREE.Color(c));

function useClayMaterial(color: string) {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.62,
        sheen: 1,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color("#ffffff"),
        clearcoat: 0.12,
        clearcoatRoughness: 0.7,
      }),
    [color],
  );
}

/** The centrepiece: a lump of clay whose surface keeps re-forming. */
type ClayUniforms = { uTime: { value: number }; uAmp: { value: number }; uFreq: { value: number } };

/** Injects the clay displacement into a physical material, recomputing normals from the displaced surface. */
function installClayShader(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: ClayUniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uTime; uniform float uAmp; uniform float uFreq;
${NOISE}
float clayField(vec3 p){
  float n = snoise(p * uFreq + vec3(uTime * 0.2, uTime * 0.15, -uTime * 0.1));
  n += 0.18 * snoise(p * uFreq * 1.9 - vec3(uTime * 0.12));
  return n * uAmp;
}`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 cT = normalize(cross(normal, abs(normal.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0)));
vec3 cB = normalize(cross(normal, cT));
float cE = 0.015;
vec3 cP0 = position + normal * clayField(position);
vec3 cP1 = position + cT * cE + normal * clayField(position + cT * cE);
vec3 cP2 = position + cB * cE + normal * clayField(position + cB * cE);
vec3 objectNormal = normalize(cross(cP1 - cP0, cP2 - cP0));`,
        )
        .replace("#include <begin_vertex>", "vec3 transformed = cP0;");
}

/** The centrepiece: a lump of clay whose surface keeps re-forming. */
function ClayBlob({ progress, colorIndex }: { progress: RefObject<number>; colorIndex: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const uniforms = useRef<ClayUniforms>({ uTime: { value: 0 }, uAmp: { value: 0.2 }, uFreq: { value: 0.62 } });
  const target = useRef(new THREE.Color(PALETTE[0]));

  useEffect(() => {
    target.current.copy(PALETTE[colorIndex % PALETTE.length]);
  }, [colorIndex]);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const u = uniforms.current;
    u.uTime.value += delta;
    u.uAmp.value = THREE.MathUtils.lerp(u.uAmp.value, 0.2 + p * 0.18, 0.06);
    material.current?.color.lerp(target.current, Math.min(1, delta * 2.5));
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.12;
      mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, state.pointer.y * 0.35, 0.05);
      mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, -state.pointer.x * 0.25, 0.05);
      const s = 1 + p * 0.35;
      mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, s, 0.08));
    }
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.05, 48]} />
      <meshPhysicalMaterial
        ref={material}
        color={PALETTE[0]}
        roughness={0.58}
        sheen={1}
        sheenRoughness={0.45}
        sheenColor="#ffffff"
        clearcoat={0.2}
        clearcoatRoughness={0.6}
        onBeforeCompile={(shader) => installClayShader(shader, uniforms.current)}
      />
    </mesh>
  );
}

function Satellites({ progress }: { progress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const peach = useClayMaterial("#ffcdb8");
  const mint = useClayMaterial("#b8ecd8");
  const butter = useClayMaterial("#ffe8a3");
  const sky = useClayMaterial("#bcdcff");
  const lilac = useClayMaterial("#cdbcff");

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const p = progress.current ?? 0;
    // Fit the orbit to narrow (portrait) stages, then drift outward as the hero scrolls away.
    const fit = Math.min(1, state.viewport.width / 5.2);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, fit * (1 + p * 0.6), 0.08));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.3, 0.04);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.2, 0.04);
  });

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={1.2} floatIntensity={1.4}>
        <mesh position={[1.95, 1.15, -0.4]} rotation={[0.6, 0.3, 0]} material={peach}>
          <torusGeometry args={[0.42, 0.19, 32, 64]} />
        </mesh>
      </Float>
      <Float speed={1.3} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[-1.95, -0.95, 0.4]} rotation={[0.2, 0, 0.9]} material={mint}>
          <capsuleGeometry args={[0.22, 0.55, 12, 24]} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.8}>
        <mesh position={[1.55, -1.35, 0.9]} material={butter}>
          <sphereGeometry args={[0.26, 48, 48]} />
        </mesh>
      </Float>
      <Float speed={1.4} rotationIntensity={1.4} floatIntensity={1.1}>
        <RoundedBox args={[0.55, 0.55, 0.55]} radius={0.16} smoothness={6} position={[-1.7, 1.35, -0.7]} rotation={[0.5, 0.6, 0.1]} material={sky} />
      </Float>
      <Float speed={2.4} rotationIntensity={0.4} floatIntensity={2}>
        <mesh position={[0.35, 1.85, 0.6]} material={lilac}>
          <sphereGeometry args={[0.14, 32, 32]} />
        </mesh>
      </Float>
    </group>
  );
}

export default function ClayScene({ progress, colorIndex }: { progress: RefObject<number>; colorIndex: number }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

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
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 7.2], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} color="#fff4ea" />
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 5, -2]} scale={[10, 4, 1]} />
          <Lightformer intensity={1.6} color="#ffd9ec" position={[-5, 1, 2]} scale={[5, 6, 1]} />
          <Lightformer intensity={1.6} color="#d9f1ff" position={[5, 0, 2]} scale={[5, 6, 1]} />
        </Environment>
        <ClayBlob progress={progress} colorIndex={colorIndex} />
        <Satellites progress={progress} />
        <ContactShadows position={[0, -1.65, 0]} opacity={0.26} scale={5.5} blur={2.6} far={3} color="#2a1e3f" />
      </Canvas>
    </div>
  );
}
