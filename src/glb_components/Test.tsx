import { useGLTF } from '@react-three/drei'
import { degToRad } from 'three/src/math/MathUtils.js'


export default function Test({glb_path}: {glb_path: string}) {
  const gltf = useGLTF(glb_path)
  return <primitive object={gltf.scene} position={[0,0.1,0]} rotation={[0, degToRad(-90), 0]}/>
}