import { folder, useControls } from "leva"
import { useCameraInit, useStart } from "@/stores"
import { useShallow } from "zustand/shallow"
import { useCallback, useEffect, useRef, useState } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"
import * as THREE from 'three'
import gsap from "gsap"
import { GsapEase } from "@/types/enums"
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'



export default function CameraControl() {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const controlRef = useRef<OrbitControlsImpl>(null!);
    const [nowAnimating, setNowAnimation] = useState<boolean>(false);

    // Set Camera init position
    const {target, pos} = useCameraInit(useShallow((state) => ({
        target: state.target,
        pos: state.pos
    })))

    const start = useStart((state) => state.start)

    // Set leva
    const [{tx, ty, tz, px, py, pz}, set] = useControls(() => ({
        'target': folder({
            tx: {value: 0, min: -5, max: 5, step: 0.01},
            ty: {value: 0, min: -5, max: 5, step: 0.01},
            tz: {value: 0, min: -5, max: 5, step: 0.01},
        }),
        'position': folder({
            px: {value: 0, min: -5, max: 5, step: 0.01},
            py: {value: 0, min: -5, max: 5, step: 0.01},
            pz: {value: 0, min: -5, max: 5, step: 0.01},
        })
    }))

    // Init camera setting
    useEffect(() => {
        // Leva
        set({
            tx: target.x,
            ty: target.y,
            tz: target.z,
            px: pos.x,
            py: pos.y,
            pz: pos.z
        })
    }, [target, pos, set])

    // Set init animation
    useEffect(() => {
        if (!start) return;
        setNowAnimation(true);
        startAnimation()

    }, [start])

    const startAnimation = useCallback(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                setNowAnimation(false);
            }
        })

        tl.to(cameraRef.current.position, {
            x: 7.5,
            y: 2,
            z: 6,
            duration: 4,
            ease: GsapEase.EXPO_IN,
            delay: 2,
        })
        tl.to(controlRef.current.target, {
            x: 0,
            y: 1,
            z: 0,
            duration: 4,
            ease: GsapEase.EXPO_IN,
            delay: 2,
            onUpdate: () => {
                controlRef.current.update();
            },
        }, 0)
    }, [cameraRef, controlRef])

    return <>
        <OrbitControls
            ref={controlRef}
            makeDefault
            target={[tx, ty, tz]}
            maxPolarAngle={degToRad(89.5)}
            dampingFactor={0.05}
            maxDistance={10}
            enablePan={false}
            enabled={!nowAnimating}
        />
        <PerspectiveCamera ref={cameraRef} near={0.01} far={50} fov={50} position={[px, py, pz]} makeDefault />
    </>
}