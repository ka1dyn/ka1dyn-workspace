import { Html } from "@react-three/drei";

type screenProps = React.JSX.IntrinsicElements['group']

export default function Screen({...props}: screenProps) {
    return (
        <group {...props}>
            <Html
                className="screen"
                transform
                distanceFactor={0.6}
                occlude={'blending'}
            >
                <iframe src="/home" />
            </Html>
        </group>
    )
}