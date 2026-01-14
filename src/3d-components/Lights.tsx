import { useTweaks } from "@/stores";
import { Environment, Lightformer, useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
// import { useFrame } from "@react-three/fiber";
// import { useLayoutEffect, useMemo, useRef } from "react";

// import { createNoise2D } from "simplex-noise";
// import { MathUtils } from "three";
// import { useApp } from "../useApp";

export default function Lights() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const spotRef = useRef<THREE.SpotLight>(null!);
  const intensity = useTweaks((state) => state.intensity);
  const lightColor = useTweaks((state) => state.lightColor);

  useHelper(lightRef, THREE.PointLightHelper, 0.2, "hotpink");
  useHelper(spotRef, THREE.SpotLightHelper, "cyan");

  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight
        intensity={0.3}
        args={[0xffffff, 0xffffff, 1.0]}
        // color={"#57bcff"}
        color={"#2798f5"}
        position={[0, 1, 0]}
        groundColor={"white"}
      />

      <rectAreaLight
        width={2.8} // Width of the light
        height={2.8} // Height of the light
        intensity={intensity} // Brightness
        // color="white"   // Light color
        color={lightColor}
        position={[0, 2.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]} // Face downward
      />

      <Environment frames={1}>
        {/* Front */}

        <Lightformer
          form="circle"
          rotation-y={Math.PI / 2}
          position={[-5, 3, 4]}
          scale={[0.5, 0.5, 1]}
          intensity={5}
          color="#ffedb1"
        />
        <Lightformer
          rotation-y={Math.PI / 2}
          position={[-5, 2, 1]}
          scale={[0.5, 0.25, 1]}
          intensity={3}
          color="#ffedb1"
        />
        <Lightformer
          form="circle"
          rotation-y={Math.PI / 2}
          position={[-5, 2, 0]}
          scale={[0.5, 0.5, 1]}
          intensity={2}
          color="#cdceff"
        />

        {/* Back */}

        <Lightformer
          rotation-y={Math.PI / 2}
          position={[5, 5, 5]}
          scale={[0.5, 5, 1]}
          intensity={1}
          color="#fff"
        />
        <Lightformer
          rotation-y={Math.PI / 2}
          position={[5, 5, 3]}
          scale={[0.5, 5, 1]}
          intensity={1.5}
          color="#fff"
        />
        <Lightformer
          rotation-y={Math.PI / 2}
          position={[5, 5, 0]}
          scale={[0.5, 5, 1]}
          intensity={1}
          color="#fff"
        />

        {/* Sides */}
        <Lightformer
          position={[0, 5, 5]}
          scale={[0.5, 3, 1]}
          intensity={1.5}
          color="#fff"
        />
        <Lightformer
          position={[0, 5, -5]}
          scale={[0.5, 3, 1]}
          intensity={1.5}
          color="#fff"
        />
      </Environment>
    </>
  );
}
