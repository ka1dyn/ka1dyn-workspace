import * as THREE from 'three'

export function warmupTextures(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
) {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return

    const materials = Array.isArray(obj.material)
      ? obj.material
      : [obj.material]

    materials.forEach((material) => {
      if (!material) return

      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) {
          renderer.initTexture(value)
        }
      })
    })
  })
}