import { warmupTextures } from '@/utils/warmupTextures'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { degToRad } from 'three/src/math/MathUtils.js'

type TestProps = React.JSX.IntrinsicElements['group'] & {
  glb_path: string
}

export default function Test({glb_path, ...props}: TestProps) {
  const {gl, scene, camera} = useThree()

  useEffect(() => {
    useGLTF.preload(glb_path)
    gl.compile(scene, camera)
    warmupTextures(scene, gl)
  })

  const gltf = useGLTF(glb_path)
  return (
    <group {...props}>
      <primitive  object={gltf.scene} position={[0,0.1,0]} rotation={[0, degToRad(-90), 0]}/>
    </group>
  )
}
