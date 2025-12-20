import Home from "@/2d-components/Home";
import { Html } from "@react-three/drei";

type screenProps = React.JSX.IntrinsicElements['group']

export default function Screen({...props}: screenProps) {
    return (
        <group {...props}>
            <Html
                className="screen w-7xl h-208"
                transform
                distanceFactor={0.138}
                occlude={"blending"}
                style={{
                borderRadius: "128px",
                overflow: "hidden",
                background: "transparent"
            }}
            >
                <div className="bg-transparent">
                    <Home />
                </div>
            </Html>
        </group>
    )
}