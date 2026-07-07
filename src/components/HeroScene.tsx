import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Edges, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useResolvedTheme } from '@/store/useTheme';

interface Palette {
  van: string;
  cabin: string;
  wheel: string;
  glass: string;
  accent: string;
  parcel: string;
  parcelAlt: string;
  tape: string;
  edge: string;
  shadow: string;
  shadowOpacity: number;
}

const PALETTES: Record<'light' | 'dark', Palette> = {
  light: {
    van: '#5B6675',
    cabin: '#454E5C',
    wheel: '#1F2733',
    glass: '#20303F',
    accent: '#E08A00',
    parcel: '#D8DCE3',
    parcelAlt: '#C3C9D3',
    tape: '#E08A00',
    edge: '#2A3340',
    shadow: '#0B0F14',
    shadowOpacity: 0.32,
  },
  dark: {
    van: '#566173',
    cabin: '#3B4553',
    wheel: '#0A0E13',
    glass: '#0B1220',
    accent: '#F59E0B',
    parcel: '#3C4859',
    parcelAlt: '#2E3948',
    tape: '#F59E0B',
    edge: '#8A97A8',
    shadow: '#000000',
    shadowOpacity: 0.5,
  },
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Box({
  args,
  position,
  color,
  edge,
  rotation,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  edge?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.05} />
      {edge && <Edges threshold={15} color={edge} />}
    </mesh>
  );
}

function Wheel({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.34, 0.34, 0.26, 28]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.15} />
    </mesh>
  );
}

function Parcel({
  size,
  position,
  color,
  tape,
  edge,
}: {
  size: number;
  position: [number, number, number];
  color: string;
  tape: string;
  edge: string;
}) {
  const h = size / 2;
  return (
    <group position={position}>
      <Box args={[size, size, size]} position={[0, 0, 0]} color={color} edge={edge} />
      {/* tape cross on the top face */}
      <mesh position={[0, h + 0.006, 0]}>
        <boxGeometry args={[size * 1.01, 0.012, size * 0.16]} />
        <meshStandardMaterial color={tape} roughness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.006, 0]}>
        <boxGeometry args={[size * 0.16, 0.012, size * 1.01]} />
        <meshStandardMaterial color={tape} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Van({ p }: { p: Palette }) {
  return (
    <group position={[0.1, 0, 0]}>
      {/* cargo body */}
      <Box args={[2.5, 1.5, 1.5]} position={[-0.35, 0.78, 0]} color={p.van} edge={p.edge} />
      {/* accent band around cargo */}
      <Box args={[2.54, 0.16, 1.54]} position={[-0.35, 1.12, 0]} color={p.accent} />
      {/* rear door seam */}
      <Box args={[0.04, 1.34, 1.5]} position={[-1.6, 0.78, 0]} color={p.cabin} />
      {/* cabin */}
      <Box args={[1.0, 1.02, 1.46]} position={[1.4, 0.54, 0]} color={p.cabin} edge={p.edge} />
      {/* windshield */}
      <Box args={[0.05, 0.5, 1.2]} position={[1.92, 0.74, 0]} color={p.glass} />
      {/* side windows */}
      <Box args={[0.55, 0.4, 0.04]} position={[1.45, 0.74, 0.72]} color={p.glass} />
      <Box args={[0.55, 0.4, 0.04]} position={[1.45, 0.74, -0.72]} color={p.glass} />
      {/* headlight hint */}
      <Box args={[0.05, 0.16, 0.2]} position={[1.92, 0.36, 0.5]} color={p.accent} />
      <Box args={[0.05, 0.16, 0.2]} position={[1.92, 0.36, -0.5]} color={p.accent} />
      {/* wheels */}
      <Wheel position={[1.15, 0.34, 0.78]} color={p.wheel} />
      <Wheel position={[1.15, 0.34, -0.78]} color={p.wheel} />
      <Wheel position={[-0.85, 0.34, 0.78]} color={p.wheel} />
      <Wheel position={[-0.85, 0.34, -0.78]} color={p.wheel} />
    </group>
  );
}

function Scene({ p }: { p: Palette }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current && !prefersReducedMotion) {
      group.current.rotation.y += delta * 0.28;
    }
  });

  return (
    <>
      <hemisphereLight args={['#ffffff', '#404652', 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 7, 4]} intensity={1.15} />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} />

      <group ref={group} rotation={[0, Math.PI * 0.16, 0]} position={[0, -0.35, 0]}>
        <Van p={p} />

        {/* grounded parcel stack */}
        <group position={[-1.75, 0, 1.05]}>
          <Parcel size={0.72} position={[0, 0.36, 0]} color={p.parcel} tape={p.tape} edge={p.edge} />
          <Parcel
            size={0.52}
            position={[0.05, 0.98, 0.02]}
            color={p.parcelAlt}
            tape={p.tape}
            edge={p.edge}
          />
        </group>

        {/* one floating parcel for life */}
        <Float speed={prefersReducedMotion ? 0 : 2} rotationIntensity={0.4} floatIntensity={0.6}>
          <Parcel
            size={0.44}
            position={[-1.5, 1.6, -0.9]}
            color={p.parcel}
            tape={p.tape}
            edge={p.edge}
          />
        </Float>

        <ContactShadows
          position={[0, 0.01, 0]}
          scale={9}
          blur={2.6}
          far={4}
          opacity={p.shadowOpacity}
          color={p.shadow}
        />
      </group>
    </>
  );
}

export default function HeroScene() {
  const theme = useResolvedTheme();
  const p = useMemo(() => PALETTES[theme], [theme]);

  return (
    <Canvas
      camera={{ position: [5, 3.1, 5.6], fov: 32 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Scene p={p} />
    </Canvas>
  );
}
