import { folder, useControls } from "leva"
import { useCameraInit, useStart } from "@/stores"
import { useShallow } from "zustand/shallow"
import { useCallback, useEffect, useRef } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"
import * as THREE from 'three'
import gsap from "gsap"
import { GsapEase } from "@/enums"


export default function CameraControl() {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

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

    useEffect(() => {
        set({
            tx: target.x,
            ty: target.y,
            tz: target.z,
            px: pos.x,
            py: pos.y,
            pz: pos.z
        })
    }, [target, pos, set])

    // Set start animation
    useEffect(() => {
        if (!start) return;

        startAnimation()

    }, [start])

    const startAnimation = useCallback(() => {
        gsap.to(cameraRef.current.position, {
            x: 7.5,
            y: 2,
            z: 6,
            duration: 5,
            ease: GsapEase.EXPO_IN,
            delay: 2
        })
    }, [cameraRef])

    return <>
        <OrbitControls
            makeDefault
            target={[tx, ty, tz]}
            maxPolarAngle={degToRad(89.5)}
            dampingFactor={0.05}
        />
        <PerspectiveCamera ref={cameraRef} near={0.01} far={50} fov={50} position={[px, py, pz]} makeDefault />
    </>
}