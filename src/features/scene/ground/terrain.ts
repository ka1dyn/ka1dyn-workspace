import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { degToRad } from "three/src/math/MathUtils.js";

// 기존 돌 지형(Ground/TestGround.tsx의 GroundBase와 Models.tsx의 배치)과 같은 값.
// 수면과 잔디가 지형과 정확히 맞아야 하므로 한곳에 모아 둔다. GroundBase를 바꾸면 여기도 바꾼다.
// 크기·분할·반복은 땅 크기에 따라 바뀌므로 terrainLayout(size)로 구한다 (기존 씬은 15m).
export const TERRAIN = {
  y: -0.03, // 그룹 위치
  rotY: degToRad(50), // 그룹 회전
  dispScale: 0.35,
  dispBias: -0.12,
} as const;

const BASE_SIZE = 15;
const BASE_SEGMENTS = 128;
const BASE_REPEAT = 2; // 변위맵 등 반복 (알파맵은 반복하지 않는다)

// 땅을 넓혀도 돌 질감과 격자 간격이 기존(15m)과 같도록 반복 횟수와 분할 수를 크기에 비례시킨다.
// 알파맵은 반복하지 않으므로 가장자리 원도 크기를 따라 넓어진다.
export function terrainLayout(size: number) {
  return {
    size,
    segments: Math.min(256, Math.round((BASE_SEGMENTS * size) / BASE_SIZE)),
    repeat: (BASE_REPEAT * size) / BASE_SIZE,
  };
}
export type TerrainLayout = ReturnType<typeof terrainLayout>;

// 같은 URL을 써야 useTexture 캐시를 공유해 텍스처를 두 번 올리지 않는다.
export const DISP_URL =
  "textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png";
export const ALPHA_URL = "textures/alpha.jpg";

// 월드 xz → 지형 평면 UV. 그룹이 y축으로 50° 돌고, 평면이 x축으로 -90° 누워 있다.
// 평면 로컬 (px, py) → 그룹 로컬 (px, 0, -py) 이므로 v = -z / size + 0.5.
const cos = Math.cos(TERRAIN.rotY);
const sin = Math.sin(TERRAIN.rotY);
export function worldToUv(
  x: number,
  z: number,
  size: number,
): [number, number] {
  const lx = cos * x - sin * z;
  const lz = sin * x + cos * z;
  return [lx / size + 0.5, -lz / size + 0.5];
}

function readPixels(
  image: CanvasImageSource & { width: number; height: number },
) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  return {
    data: ctx.getImageData(0, 0, image.width, image.height).data,
    w: image.width,
    h: image.height,
  };
}

type Pixels = ReturnType<typeof readPixels>;

// 텍스처는 flipY라서 v=0이 이미지 아래쪽이다.
function texel(p: Pixels, u: number, v: number) {
  const x = Math.min(p.w - 1, Math.max(0, Math.floor(u * p.w)));
  const y = Math.min(p.h - 1, Math.max(0, Math.floor((1 - v) * p.h)));
  return p.data[(y * p.w + x) * 4] / 255;
}

const fract = (x: number) => x - Math.floor(x);

// 잔디를 지형 표면에 심기 위한 CPU 샘플러.
// 지형은 격자 꼭짓점에서만 변위를 읽으므로, 같은 꼭짓점 높이를 쌍선형 보간해 실제 메시와 맞춘다.
export function useTerrainSampler(layout: TerrainLayout) {
  const [disp, alpha] = useTexture([DISP_URL, ALPHA_URL]);
  return useMemo(() => {
    const d = readPixels(disp.image as HTMLImageElement);
    const a = readPixels(alpha.image as HTMLImageElement);
    const { size, segments: n, repeat } = layout;
    const vertexHeight = (i: number, j: number) => {
      const u = i / n;
      const v = j / n;
      const raw = texel(d, fract(u * repeat), fract(v * repeat));
      return raw * TERRAIN.dispScale + TERRAIN.dispBias + TERRAIN.y;
    };
    return {
      /** 월드 xz에서 지형 표면의 월드 y */
      heightAt(x: number, z: number) {
        const [u, v] = worldToUv(x, z, size);
        const fx = Math.min(n, Math.max(0, u * n));
        const fy = Math.min(n, Math.max(0, v * n));
        const i = Math.min(n - 1, Math.floor(fx));
        const j = Math.min(n - 1, Math.floor(fy));
        const tx = fx - i;
        const ty = fy - j;
        const h00 = vertexHeight(i, j);
        const h10 = vertexHeight(i + 1, j);
        const h01 = vertexHeight(i, j + 1);
        const h11 = vertexHeight(i + 1, j + 1);
        return (
          (h00 * (1 - tx) + h10 * tx) * (1 - ty) +
          (h01 * (1 - tx) + h11 * tx) * ty
        );
      },
      /** 월드 xz에서 지형 알파맵 값 [0, 1] (가장자리로 갈수록 0) */
      alphaAt(x: number, z: number) {
        const [u, v] = worldToUv(x, z, size);
        if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
        return texel(a, u, v);
      },
    };
  }, [disp, alpha, layout]);
}

export type TerrainSampler = ReturnType<typeof useTerrainSampler>;

// 셰이더용: 지형과 같은 텍스처 객체 (변위맵의 RepeatWrapping은 GroundBase가 설정한다).
export function useTerrainTextures() {
  const [disp, alpha] = useTexture([DISP_URL, ALPHA_URL]);
  return { disp, alpha };
}
