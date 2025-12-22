import { folder, useControls } from "leva"
import { useCameraInit } from "@/stores"
import { useShallow } from "zustand/shallow"
import { useEffect } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"


export default function CameraControl() {
    // Set Camera init position
    const {target, pos} = useCameraInit(useShallow((state) => ({
        target: state.target,
        pos: state.pos
    })))

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

    return <>
        <OrbitControls
            makeDefault
            target={[tx, ty, tz]}
            maxPolarAngle={degToRad(89.5)}
            dampingFactor={0.05}
        />
        <PerspectiveCamera near={0.01} far={50} fov={50} position={[px, py, pz]} makeDefault />
    </>
}