import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function createParticlePositions(count) {
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 13;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[index * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return positions;
}

function ParticleField({ count }) {
    const points = useRef(null);
    const positions = useMemo(() => createParticlePositions(count), [count]);

    useFrame(({ clock }) => {
        if (!points.current) return;
        const attribute = points.current.geometry.attributes.position;
        const time = clock.getElapsedTime();

        for (let index = 0; index < count; index += 1) {
            const offset = index * 3;
            attribute.array[offset + 1] += Math.sin(time * 0.18 + index) * 0.00035;
            if (attribute.array[offset + 1] > 5) attribute.array[offset + 1] = -5;
        }

        attribute.needsUpdate = true;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                color="#d9e0de"
                size={0.018}
                sizeAttenuation
                transparent
                opacity={0.58}
                depthWrite={false}
            />
        </points>
    );
}

function Artifact({ motion, pointer, reducedMotion }) {
    const group = useRef(null);
    const core = useRef(null);
    const ring = useRef(null);
    const wire = useRef(null);
    const smoothPointer = useRef(new THREE.Vector2());

    useFrame(({ clock }, delta) => {
        if (!group.current) return;
        const time = clock.getElapsedTime();
        smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, pointer.current.x, 3, delta);
        smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, pointer.current.y, 3, delta);

        group.current.position.x = THREE.MathUtils.damp(
            group.current.position.x,
            motion.current.x + smoothPointer.current.x * 0.22,
            2.4,
            delta
        );
        group.current.position.y = THREE.MathUtils.damp(
            group.current.position.y,
            motion.current.y + (reducedMotion ? 0 : Math.sin(time * 0.48) * 0.12) + smoothPointer.current.y * 0.14,
            2.4,
            delta
        );
        group.current.rotation.x = THREE.MathUtils.damp(
            group.current.rotation.x,
            motion.current.rotateX + smoothPointer.current.y * 0.1 + Math.sin(time * 0.22) * 0.035,
            2,
            delta
        );
        group.current.rotation.y = THREE.MathUtils.damp(
            group.current.rotation.y,
            (reducedMotion ? 0 : time * 0.11) + motion.current.rotateY + smoothPointer.current.x * 0.14,
            2,
            delta
        );
        group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, motion.current.rotateZ, 2, delta);
        group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, motion.current.scale, 2.2, delta));

        if (core.current) core.current.rotation.z = reducedMotion ? 0 : time * 0.04;
        if (ring.current) ring.current.rotation.z = reducedMotion ? 0 : -time * 0.08;
        if (wire.current) wire.current.rotation.y = reducedMotion ? 0 : time * 0.07;
    });

    return (
        <group ref={group}>
            <mesh ref={core}>
                <torusKnotGeometry args={[1.12, 0.34, 220, 28, 2, 5]} />
                <meshPhysicalMaterial
                    color="#aeb7b6"
                    metalness={0.86}
                    roughness={0.19}
                    clearcoat={1}
                    clearcoatRoughness={0.12}
                />
            </mesh>
            <mesh ref={ring} rotation={[1.08, 0.18, 0.15]}>
                <torusGeometry args={[1.86, 0.025, 12, 180]} />
                <meshStandardMaterial color="#e7e9e6" metalness={0.92} roughness={0.23} />
            </mesh>
            <mesh ref={wire} rotation={[0.28, 1.14, 0.4]}>
                <torusGeometry args={[2.12, 0.009, 6, 180]} />
                <meshBasicMaterial color="#a5b0ab" transparent opacity={0.72} />
            </mesh>
            <mesh rotation={[0.7, 0.25, 1.05]}>
                <torusGeometry args={[1.53, 0.012, 8, 140]} />
                <meshBasicMaterial color="#b7a68d" transparent opacity={0.78} />
            </mesh>
            <mesh position={[0, 0, -0.48]} scale={0.54}>
                <icosahedronGeometry args={[1, 3]} />
                <MeshDistortMaterial
                    color="#d4d9d5"
                    metalness={0.38}
                    roughness={0.28}
                    distort={0.18}
                    speed={0.45}
                    transparent
                    opacity={0.82}
                    clearcoat={1}
                />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
                <sphereGeometry args={[0.055, 24, 24]} />
                <meshBasicMaterial color="#e7dbc6" toneMapped={false} />
            </mesh>
        </group>
    );
}

function CameraDirector({ motion }) {
    useFrame(({ camera }, delta) => {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, motion.current.x * 0.2, 1.8, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, motion.current.y * 0.18, 1.8, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, motion.current.z, 1.8, delta);
        camera.lookAt(motion.current.x * 0.08, motion.current.y * 0.05, 0);
    });

    return null;
}

function ShowcaseForm({ motion, pointer, reducedMotion }) {
    const form = useRef(null);

    useFrame(({ clock }, delta) => {
        if (!form.current) return;
        const reveal = THREE.MathUtils.damp(form.current.scale.x, motion.current.showcase, 2, delta);
        form.current.scale.setScalar(reveal);
        if (!reducedMotion) form.current.rotation.y += delta * 0.1;
        form.current.rotation.x = THREE.MathUtils.damp(form.current.rotation.x, pointer.current.y * 0.06, 2, delta);
        form.current.position.y = -0.15 + Math.sin(clock.getElapsedTime() * 0.36) * 0.08;
    });

    return (
        <group ref={form} scale={0} position={[0, -0.15, -0.4]}>
            <mesh>
                <icosahedronGeometry args={[1.18, 3]} />
                <meshPhysicalMaterial color="#7e8988" metalness={0.82} roughness={0.17} clearcoat={1} wireframe />
            </mesh>
            <mesh scale={0.72}>
                <icosahedronGeometry args={[1.14, 2]} />
                <meshPhysicalMaterial color="#c2cbc6" metalness={0.62} roughness={0.24} transparent opacity={0.22} transmission={0.78} thickness={1.2} />
            </mesh>
            {[0, 1, 2].map((index) => (
                <mesh key={index} rotation={[index * 0.72, index * 0.94, index * 0.38]}>
                    <torusGeometry args={[1.56 + index * 0.18, 0.012, 8, 144]} />
                    <meshStandardMaterial color={index === 1 ? "#b6a68e" : "#dce2dd"} metalness={0.9} roughness={0.2} />
                </mesh>
            ))}
        </group>
    );
}

export default function ExperienceScene({ motion, pointer, compact = false, reducedMotion = false }) {
    return (
        <>
            <CameraDirector motion={motion} />
            <color attach="background" args={["#080a0a"]} />
            <fog attach="fog" args={["#080a0a", 8, 22]} />
            <ambientLight intensity={0.34} />
            <directionalLight position={[4, 5, 5]} intensity={2.1} color="#f6f2e9" />
            <directionalLight position={[-5, 0, 2]} intensity={1.6} color="#aab9b7" />
            <pointLight position={[0, -3, -2]} intensity={18} distance={12} color="#a7855f" />
            <pointLight position={[3, 1, 2]} intensity={13} distance={10} color="#e3e9e4" />
            <ParticleField count={reducedMotion ? 0 : compact ? 100 : 280} />
            <Sparkles count={reducedMotion ? 0 : compact ? 18 : 38} scale={[12, 9, 7]} size={1.15} speed={reducedMotion ? 0 : 0.12} color="#b7c4bf" opacity={0.38} />
            <Float speed={reducedMotion ? 0 : 0.6} rotationIntensity={reducedMotion ? 0 : 0.08} floatIntensity={reducedMotion ? 0 : 0.14}>
                <Artifact motion={motion} pointer={pointer} reducedMotion={reducedMotion} />
            </Float>
            <ShowcaseForm motion={motion} pointer={pointer} reducedMotion={reducedMotion} />
        </>
    );
}