import { useFrame } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import CSM from "three-custom-shader-material";

// interface DropsProps extends JSX.IntrinsicElements['group']{
//   count?: number;
// }

type DropsProps = React.JSX.IntrinsicElements["group"] & {
  count?: number;
  // 반짝임: 빗방울마다 다른 주기로 가끔 짧게 더 진해진다. 0이면 기존 빗방울과 똑같다
  sparkle?: number; // 빈도 (0~1)
  sparkleBoost?: number; // 반짝일 때 진해지는 배율
  speed?: number; // 떨어지는 속도 (m/s)
  spread?: number; // 빗방울이 생기는 정사각형 한 변 (m). 가장자리 옅어짐도 이 크기를 따른다 (기존 10)
};

export const Drops = React.forwardRef<THREE.Group, DropsProps>(
  (
    {
      count = 300,
      sparkle = 0,
      sparkleBoost = 0,
      speed = 6,
      spread = 10,
      ...props
    },
    fref,
  ) => {
    const dropsRef = React.useRef<THREE.InstancedMesh>(null!);
    const _dummy = React.useMemo(() => new THREE.Object3D(), []);
    const initialY = React.useMemo(() => new Float32Array(count).fill(0), []);
    const angles = React.useMemo(() => new Float32Array(count).fill(0), []);

    React.useEffect(() => {
      const dropsMesh = dropsRef.current;
      for (let i = 0; i < count; i++) {
        const initX = THREE.MathUtils.randFloatSpread(spread);
        const initZ = THREE.MathUtils.randFloatSpread(spread);

        let initY = THREE.MathUtils.randFloat(-0.1, 6);
        if (initX < 2.3 || initX > -2.3) {
          if (initZ < 2.3 || initZ > -2.3) {
            initY = THREE.MathUtils.randFloat(3, 6);
          }
        }

        _dummy.position.set(initX, initY, initZ);

        _dummy.updateMatrix();
        dropsMesh.setMatrixAt(i, _dummy.matrix);
      }
      dropsMesh.instanceMatrix.needsUpdate = true;
    }, []);

    useFrame(({ camera, clock }, dt) => {
      const dropsMesh = dropsRef.current;

      for (let i = 0; i < count; i++) {
        dropsMesh.getMatrixAt(i, _dummy.matrix);
        _dummy.matrix.decompose(
          _dummy.position,
          _dummy.quaternion,
          _dummy.scale,
        );

        _dummy.rotation.y = Math.atan2(
          camera.position.x - _dummy.position.x,
          camera.position.z - _dummy.position.z,
        );
        _dummy.rotation.x = angles[i];
        _dummy.position.y -= dt * speed;

        if (
          _dummy.position.y <= 0 ||
          (_dummy.position.z > -2.3 &&
            _dummy.position.z < 2.3 &&
            _dummy.position.x > -2.3 &&
            _dummy.position.x < 2.3 &&
            _dummy.position.y < 2.7)
        ) {
          const initX = THREE.MathUtils.randFloatSpread(spread);
          const initZ = THREE.MathUtils.randFloatSpread(spread);

          let initY = THREE.MathUtils.randFloat(-0.1, 6);
          if (initX < 2.3 || initX > -2.3) {
            if (initZ < 2.3 || initZ > -2.3) {
              initY = THREE.MathUtils.randFloat(3, 6);
            }
          }
          _dummy.position.set(initX, initY, initZ);

          initialY[i] = _dummy.position.y;
          angles[i] = THREE.MathUtils.randFloatSpread(
            THREE.MathUtils.degToRad(20),
          );
          _dummy.scale.setScalar(THREE.MathUtils.randFloat(0.3, 0.6));
        }

        _dummy.updateMatrix();
        dropsMesh.setMatrixAt(i, _dummy.matrix);
      }
      dropsMesh.instanceMatrix.needsUpdate = true;

      // CustomShaderMaterial은 material.uniforms로 uniform을 노출한다
      const u = (dropsMesh.material as THREE.ShaderMaterial).uniforms;
      if (u?.uSparkle) {
        u.uTime.value = clock.elapsedTime;
        u.uSparkle.value = sparkle;
        u.uFadeRadius.value = 8.5 * (spread / 10);
        u.uSparkleBoost.value = sparkleBoost;
      }
    });

    const vertexShader = React.useMemo(
      () => /* glsl */ `
        uniform float uTime;
  
        varying vec3 vInstancePosition;
        varying vec2 vUv;
        varying float vSeed;
  
        void main() {
          vInstancePosition = (instanceMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          vSeed = fract(float(gl_InstanceID) * 0.6180339);
        }
      `,
      [],
    );

    const fragmentShader = React.useMemo(
      () => /* glsl */ `
        uniform float uRainProgress;
        uniform float uTime;
        uniform float uSparkle;
        uniform float uSparkleBoost;
        uniform float uFadeRadius;
  
        varying vec3 vInstancePosition;
        varying vec2 vUv;
        varying float vSeed;

        float sdUnevenCapsule( vec2 p, float r1, float r2, float h ) {
          p.x = abs(p.x);
          float b = (r1-r2)/h;
          float a = sqrt(1.0-b*b);
          float k = dot(p,vec2(-b,a));
          if( k < 0.0 ) return length(p) - r1;
          if( k > a*h ) return length(p-vec2(0.0,h)) - r2;
          return dot(p, vec2(a,b) ) - r1;
        }
  
        float blur(float steps) {
          vec2 coord = vUv - 0.5;
          coord *= 10.0;
  
          // Get n droplets around this one and average their distance
          float total = 0.0;
          for (float i = 0.0; i < steps; i++) {
            float dropletDistance = sdUnevenCapsule(coord, 0.05, 0.0, 2.0);
            dropletDistance = 1.0 - smoothstep(0.0, 0.05, dropletDistance);
            total += dropletDistance;
            coord += vec2(0.0, 0.2);
          }
          return total / steps;
        }

        float sdCircle( vec2 p, float r ) {
          return length(p) - r;
        }
  
        void main() {
          float dropletDistance = blur(5.0);
          float rainProgress = smoothstep(0.0, 0.5, uRainProgress);
          rainProgress = clamp(rainProgress, 0.0, 1.0);
          // 중심에서 멀어질수록 옅게. 기존(범위 10m)은 8.5m에서 0이 되고, 범위에 비례해 늘어난다
          float circle = uFadeRadius - length(vInstancePosition.xz);
          csm_DiffuseColor.a = dropletDistance * 0.1 * rainProgress * circle;

          // 반짝임: 색·모양은 그대로 두고, 빗방울마다 다른 주기로 아주 짧게 더 진해진다
          if (uSparkle > 0.0) {
            float phase = uTime * (2.0 + vSeed * 5.0) + vSeed * 40.0;
            float blink = smoothstep(1.0 - 0.2 * uSparkle, 1.0, sin(phase) * 0.5 + 0.5);
            csm_DiffuseColor.a *= 1.0 + blink * uSparkleBoost;
          }
          
        }
      `,
      [],
    );

    const uniforms = React.useMemo(
      () => ({
        uRainProgress: { value: 1 },
        uTime: { value: 0 },
        uSparkle: { value: 0 },
        uSparkleBoost: { value: 0 },
        uFadeRadius: { value: 8.5 },
      }),
      [],
    );

    return (
      <group ref={fref} {...props}>
        <instancedMesh
          ref={dropsRef}
          args={[undefined, undefined, count]}
          renderOrder={2}
        >
          <planeGeometry args={[0.5, 1]} />
          <CSM
            key={vertexShader + fragmentShader}
            baseMaterial={THREE.MeshBasicMaterial}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
          />
        </instancedMesh>
      </group>
    );
  },
);
