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

    // Set init animation
    useEffect(() => {
        if (!start) return;
        setNowAnimation(true);
        startAnimation()

    }, [start])

    const startAnimation = useCallback(() => {
        const tl = gsap.timeline({
            delay: 6,
            onComplete: () => {
                setNowAnimation(false);
            }
        })

        tl.to(cameraRef.current.position, {
            x: 7.5,
            y: 2,
            z: 6,
            duration: 4,
            ease: GsapEase.POWER4_INOUT,
        })
        tl.to(controlRef.current.target, {
            x: 0,
            y: 1,
            z: 0,
            duration: 4,
            ease: GsapEase.POWER4_INOUT,
            
            onUpdate: () => {
                controlRef.current.update();
            },
        }, 0)

    }, [cameraRef, controlRef])

    return <>
        <OrbitControls
            ref={controlRef}
            makeDefault
            target={[target.x, target.y, target.z]}
            maxPolarAngle={degToRad(89.5)}
            dampingFactor={0.05}
            maxDistance={10}
            enablePan={false}
            enabled={!nowAnimating}
        />
        <PerspectiveCamera ref={cameraRef} near={0.01} far={50} fov={50} position={[pos.x, pos.y, pos.z]} makeDefault />
    </>
}