import { useCameraInit, useOverlay, useStart } from "@/stores"
import { useShallow } from "zustand/shallow"
import { useCallback, useEffect, useRef, useState } from "react"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"
import { Overlay as OverlayTypes } from "@/types/enums"
import * as THREE from 'three'
import gsap from "gsap"
import { GsapEase, Overlay } from "@/types/enums"
import { type OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export default function CameraControl() {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const controlRef = useRef<OrbitControlsImpl>(null!);
    const [enable, setEnable] = useState<boolean>(true);
    const {type, setType, setActive} = useOverlay(useShallow((state) => ({
        type: state.type,
        setType: state.setType,
        setActive: state.setActive,
    })))
    const typeRef = useRef<Overlay | null>(null);

    // Set Camera init position
    const {target, pos} = useCameraInit(useShallow((state) => ({
        target: state.target,
        pos: state.pos,
    })))

    const start = useStart((state) => state.start)

    // Set init animation
    useEffect(() => {
        if (!start) return;
        setEnable(false);
        startAnimation()
    }, [start])

    const startAnimation = useCallback(() => {
        const tl = gsap.timeline({
            delay: 6,
            onComplete: () => {
                setEnable(true)
                setActive(true)
                setType(OverlayTypes.DEFAULT)
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

    useEffect(() => {
        if (type == Overlay.SCREEN) {
            setEnable(false)
            screenAnimation()
        } else if (type == Overlay.DEFAULT) {
            // Ignore init trigger
            if (typeRef.current == null) {
                typeRef.current = type;
                return;
            }
            setEnable(false)
            backAnimation();
        }
    }, [type])

    const screenAnimation = useCallback(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                setActive(true);
            }
        })

        tl.to(cameraRef.current.position, {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            duration: 2,
            ease: GsapEase.POWER2_INOUT,
        })
        tl.to(controlRef.current.target, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: 2,
            ease: GsapEase.POWER2_INOUT,
            
            onUpdate: () => {
                console.log(target.x, target.y, target.z)
                controlRef.current.update();
            },
        }, 0)
    }, [cameraRef, controlRef, target, pos])

    const backAnimation = useCallback(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                setEnable(true)
                setActive(true)
            }
        })

        tl.to(cameraRef.current.position, {
            x: 7.5,
            y: 2,
            z: 6,
            duration: 2.5,
            ease: GsapEase.POWER3_INOUT,
        })
        tl.to(controlRef.current.target, {
            x: 0,
            y: 1,
            z: 0,
            duration: 2.5,
            ease: GsapEase.POWER3_INOUT,
            
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
            enabled={enable}
        />
    <PerspectiveCamera ref={cameraRef} near={0.01} far={50} fov={50} position={[pos.x, pos.y, pos.z]} makeDefault />
    </>
}