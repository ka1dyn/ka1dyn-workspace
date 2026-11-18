import { IS_LAB } from "./store";

// GPU 메모리 추정기.
// three.js의 renderer.info는 텍스처·지오메트리 "개수"만 알려 준다. 그래서 WebGL의 할당 함수
// (texStorage2D, texImage2D, renderbufferStorage, bufferData …)를 가로채, 페이지가 GPU에
// 요청한 크기(가로 × 세로 × 픽셀당 바이트 × 밉맵 단계)를 객체별로 기록하고 삭제되면 뺀다.
// 드라이버의 정렬·패딩·압축은 알 수 없으므로 "요청한 양" 기준의 추정치다.
// 렌더러가 만들어지기 전에 설치돼야 하므로 모듈을 불러오는 순간 패치한다.

const G = WebGL2RenderingContext;

type Kind = "texture" | "renderbuffer" | "buffer";
interface Entry {
  kind: Kind;
  parts: Map<string, number>; // (면·밉맵 단계) → 바이트
  rt: boolean; // 프레임버퍼에 붙은 적이 있으면 렌더 타깃으로 분류
}
// WebGL 객체를 Map 키로 직접 잡으면 추적기 때문에 객체가 GC되지 못한다(= 추적기가 누수를 만든다).
// 그래서 객체 → 번호는 WeakMap으로만 잇고, 객체가 GC되면 FinalizationRegistry로 항목을 지운다.
// 브라우저는 dispose 없이 버려진 WebGL 객체도 GC 시점에 GPU에서 해제한다.
interface Tracker {
  entries: Map<number, Entry>;
  ids: WeakMap<object, number>;
  unknownFormat: boolean;
}
let nextId = 1;
const collected = new FinalizationRegistry<{ t: Tracker; id: number }>(
  ({ t, id }) => {
    t.entries.delete(id);
  },
);

const trackers = new WeakMap<WebGL2RenderingContext, Tracker>();
const trackerOf = (gl: WebGL2RenderingContext) => {
  let t = trackers.get(gl);
  if (!t)
    trackers.set(
      gl,
      (t = { entries: new Map(), ids: new WeakMap(), unknownFormat: false }),
    );
  return t;
};
const entryOf = (t: Tracker, obj: object, kind: Kind) => {
  let id = t.ids.get(obj);
  if (id == null) {
    id = nextId++;
    t.ids.set(obj, id);
    collected.register(obj, { t, id }, obj);
  }
  let e = t.entries.get(id);
  if (!e) t.entries.set(id, (e = { kind, parts: new Map(), rt: false }));
  return e;
};
const forget = (t: Tracker, obj: object | null) => {
  const id = obj && t.ids.get(obj);
  if (id == null || !obj) return;
  t.entries.delete(id);
  collected.unregister(obj);
};

// ---- 포맷별 픽셀당 바이트 ----
const SIZED: Record<number, number> = {
  [G.R8]: 1,
  [G.R8_SNORM]: 1,
  [G.RG8]: 2,
  [G.RGB8]: 3,
  [G.SRGB8]: 3,
  [G.RGBA8]: 4,
  [G.SRGB8_ALPHA8]: 4,
  [G.RGB565]: 2,
  [G.RGBA4]: 2,
  [G.RGB5_A1]: 2,
  [G.RGB10_A2]: 4,
  [G.R11F_G11F_B10F]: 4,
  [G.RGB9_E5]: 4,
  [G.R16F]: 2,
  [G.RG16F]: 4,
  [G.RGB16F]: 6,
  [G.RGBA16F]: 8,
  [G.R32F]: 4,
  [G.RG32F]: 8,
  [G.RGB32F]: 12,
  [G.RGBA32F]: 16,
  [G.R8UI]: 1,
  [G.R16UI]: 2,
  [G.R32UI]: 4,
  [G.R32I]: 4,
  [G.RG8UI]: 2,
  [G.RGBA8UI]: 4,
  [G.RGBA16UI]: 8,
  [G.RGBA32UI]: 16,
  [G.DEPTH_COMPONENT16]: 2,
  [G.DEPTH_COMPONENT24]: 4,
  [G.DEPTH_COMPONENT32F]: 4,
  [G.DEPTH24_STENCIL8]: 4,
  [G.DEPTH32F_STENCIL8]: 8,
  [G.STENCIL_INDEX8]: 1,
};
// 압축 포맷 (확장 상수값). 블록 단위 반올림은 무시한다.
const COMPRESSED: Record<number, number> = {
  0x83f0: 0.5,
  0x83f1: 0.5,
  0x83f2: 1,
  0x83f3: 1, // S3TC (DXT1/3/5)
  0x9274: 0.5,
  0x9275: 0.5,
  0x9278: 1,
  0x9279: 1, // ETC2
  0x8e8c: 1,
  0x8e8d: 1,
  0x8e8e: 1,
  0x8e8f: 1, // BPTC
  0x93b0: 1,
  0x93d0: 1, // ASTC 4x4
};
const CHANNELS: Record<number, number> = {
  [G.RGBA]: 4,
  [G.RGB]: 3,
  [G.RG]: 2,
  [G.RED]: 1,
  [G.LUMINANCE_ALPHA]: 2,
  [G.LUMINANCE]: 1,
  [G.ALPHA]: 1,
  [G.RGBA_INTEGER]: 4,
  [G.RGB_INTEGER]: 3,
  [G.RG_INTEGER]: 2,
  [G.RED_INTEGER]: 1,
  [G.DEPTH_COMPONENT]: 1,
  [G.DEPTH_STENCIL]: 1,
};
const TYPE_BYTES: Record<number, number> = {
  [G.UNSIGNED_BYTE]: 1,
  [G.BYTE]: 1,
  [G.UNSIGNED_SHORT]: 2,
  [G.SHORT]: 2,
  [G.HALF_FLOAT]: 2,
  [G.FLOAT]: 4,
  [G.UNSIGNED_INT]: 4,
  [G.INT]: 4,
};
// 채널을 묶어 저장하는 타입은 픽셀당 크기가 고정이다.
const PACKED: Record<number, number> = {
  [G.UNSIGNED_SHORT_5_6_5]: 2,
  [G.UNSIGNED_SHORT_4_4_4_4]: 2,
  [G.UNSIGNED_SHORT_5_5_5_1]: 2,
  [G.UNSIGNED_INT_24_8]: 4,
  [G.UNSIGNED_INT_2_10_10_10_REV]: 4,
  [G.UNSIGNED_INT_10F_11F_11F_REV]: 4,
  [G.UNSIGNED_INT_5_9_9_9_REV]: 4,
  [G.FLOAT_32_UNSIGNED_INT_24_8_REV]: 8,
};

function bpp(t: Tracker, ifmt: number, format?: number, type?: number) {
  const sized = SIZED[ifmt] ?? COMPRESSED[ifmt];
  if (sized != null) return sized;
  if (type != null && PACKED[type] != null) return PACKED[type];
  if (format != null && type != null && CHANNELS[format] && TYPE_BYTES[type])
    return CHANNELS[format] * TYPE_BYTES[type];
  t.unknownFormat = true;
  return 4;
}

const isCubeFace = (target: number) =>
  target >= G.TEXTURE_CUBE_MAP_POSITIVE_X &&
  target <= G.TEXTURE_CUBE_MAP_NEGATIVE_Z;

function boundTexture(gl: WebGL2RenderingContext, target: number) {
  if (target === G.TEXTURE_2D) return gl.getParameter(G.TEXTURE_BINDING_2D);
  if (target === G.TEXTURE_CUBE_MAP || isCubeFace(target))
    return gl.getParameter(G.TEXTURE_BINDING_CUBE_MAP);
  if (target === G.TEXTURE_3D) return gl.getParameter(G.TEXTURE_BINDING_3D);
  if (target === G.TEXTURE_2D_ARRAY)
    return gl.getParameter(G.TEXTURE_BINDING_2D_ARRAY);
  return null;
}

const BUFFER_BINDING: Record<number, number> = {
  [G.ARRAY_BUFFER]: G.ARRAY_BUFFER_BINDING,
  [G.ELEMENT_ARRAY_BUFFER]: G.ELEMENT_ARRAY_BUFFER_BINDING,
  [G.UNIFORM_BUFFER]: G.UNIFORM_BUFFER_BINDING,
  [G.COPY_READ_BUFFER]: G.COPY_READ_BUFFER_BINDING,
  [G.COPY_WRITE_BUFFER]: G.COPY_WRITE_BUFFER_BINDING,
  [G.PIXEL_PACK_BUFFER]: G.PIXEL_PACK_BUFFER_BINDING,
  [G.PIXEL_UNPACK_BUFFER]: G.PIXEL_UNPACK_BUFFER_BINDING,
  [G.TRANSFORM_FEEDBACK_BUFFER]: G.TRANSFORM_FEEDBACK_BUFFER_BINDING,
};

type Src = {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
  displayWidth?: number;
  displayHeight?: number;
};
const srcSize = (s: Src) => [
  s.videoWidth || s.displayWidth || s.width || 0,
  s.videoHeight || s.displayHeight || s.height || 0,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Hook = (gl: WebGL2RenderingContext, t: Tracker, a: any[]) => void;
function wrap(name: string, after: Hook) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = G.prototype as any;
  const orig = proto[name];
  proto[name] = function (this: WebGL2RenderingContext, ...args: unknown[]) {
    const r = orig.apply(this, args);
    try {
      after(this, trackerOf(this), args);
    } catch {
      /* 측정 실패가 렌더링을 막지 않게 한다 */
    }
    return r;
  };
}

function install() {
  const w = window as unknown as { __labVram?: boolean };
  if (w.__labVram) return; // HMR로 두 번 패치되는 것을 막는다
  w.__labVram = true;

  // 불변 저장소: 모든 밉맵 단계를 한 번에 잡는다 (three는 WebGL2에서 주로 이 경로를 쓴다)
  wrap("texStorage2D", (gl, t, [target, levels, ifmt, w0, h0]) => {
    const tex = boundTexture(gl, target);
    if (!tex) return;
    const faces = target === G.TEXTURE_CUBE_MAP ? 6 : 1;
    const b = bpp(t, ifmt);
    let sum = 0;
    for (let l = 0; l < levels; l++)
      sum += Math.max(1, w0 >> l) * Math.max(1, h0 >> l) * b * faces;
    entryOf(t, tex, "texture").parts = new Map([["storage", sum]]);
  });
  wrap("texStorage3D", (gl, t, [target, levels, ifmt, w0, h0, d0]) => {
    const tex = boundTexture(gl, target);
    if (!tex) return;
    const b = bpp(t, ifmt);
    let sum = 0;
    for (let l = 0; l < levels; l++) {
      const d = target === G.TEXTURE_3D ? Math.max(1, d0 >> l) : d0;
      sum += Math.max(1, w0 >> l) * Math.max(1, h0 >> l) * d * b;
    }
    entryOf(t, tex, "texture").parts = new Map([["storage", sum]]);
  });
  // 가변 저장소: 단계(level)마다 따로 올린다. 같은 단계를 다시 올리면 덮어쓴다.
  wrap("texImage2D", (gl, t, a) => {
    const [target, level, ifmt] = a;
    const tex = boundTexture(gl, target);
    if (!tex) return;
    let w0: number, h0: number, format: number, type: number;
    if (a.length >= 8) [, , , w0, h0, , format, type] = a;
    else {
      [, , , format, type] = a;
      [w0, h0] = srcSize(a[5] as Src);
    }
    entryOf(t, tex, "texture").parts.set(
      `${target}:${level}`,
      w0 * h0 * bpp(t, ifmt, format, type),
    );
  });
  wrap(
    "texImage3D",
    (gl, t, [target, level, ifmt, w0, h0, d0, , format, type]) => {
      const tex = boundTexture(gl, target);
      if (!tex) return;
      entryOf(t, tex, "texture").parts.set(
        `${target}:${level}`,
        w0 * h0 * d0 * bpp(t, ifmt, format, type),
      );
    },
  );
  wrap("compressedTexImage2D", (gl, t, [target, level, , , , , data]) => {
    const tex = boundTexture(gl, target);
    if (!tex) return;
    const bytes = typeof data === "number" ? data : (data?.byteLength ?? 0);
    entryOf(t, tex, "texture").parts.set(`${target}:${level}`, bytes);
  });
  // 가변 저장소에서 밉맵을 만들면 0단계의 약 1/3이 더 든다 (1 + 1/4 + 1/16 + … ≈ 4/3)
  wrap("generateMipmap", (gl, t, [target]) => {
    const tex = boundTexture(gl, target);
    const id = tex && t.ids.get(tex);
    const e = id != null ? t.entries.get(id) : undefined;
    if (!e || e.parts.has("storage")) return;
    for (const [k, v] of [...e.parts])
      if (k.endsWith(":0")) e.parts.set(k.replace(/:0$/, ":mips"), v / 3);
  });
  wrap("deleteTexture", (_gl, t, [tex]) => forget(t, tex));

  // 프레임버퍼에 붙는 텍스처 = 렌더 타깃 (후처리 버퍼, 그림자 맵, PMREM 등)
  wrap("framebufferTexture2D", (_gl, t, [, , , tex]) => {
    if (tex) entryOf(t, tex, "texture").rt = true;
  });
  wrap("framebufferTextureLayer", (_gl, t, [, , tex]) => {
    if (tex) entryOf(t, tex, "texture").rt = true;
  });

  // 렌더버퍼: 멀티샘플이면 샘플 수만큼 곱한다
  const rbStore = (
    gl: WebGL2RenderingContext,
    t: Tracker,
    samples: number,
    ifmt: number,
    w0: number,
    h0: number,
  ) => {
    const rb = gl.getParameter(G.RENDERBUFFER_BINDING);
    if (!rb) return;
    entryOf(t, rb, "renderbuffer").parts = new Map([
      ["s", w0 * h0 * bpp(t, ifmt) * Math.max(1, samples)],
    ]);
  };
  wrap("renderbufferStorage", (gl, t, [, ifmt, w0, h0]) =>
    rbStore(gl, t, 1, ifmt, w0, h0),
  );
  wrap("renderbufferStorageMultisample", (gl, t, [, samples, ifmt, w0, h0]) =>
    rbStore(gl, t, samples, ifmt, w0, h0),
  );
  wrap("deleteRenderbuffer", (_gl, t, [rb]) => forget(t, rb));

  // 정점·인덱스·유니폼 버퍼
  wrap("bufferData", (gl, t, [target, src, , srcOffset, length]) => {
    const binding = BUFFER_BINDING[target];
    const buf = binding && gl.getParameter(binding);
    if (!buf) return;
    let bytes: number;
    if (typeof src === "number") bytes = src;
    else if (!src) bytes = 0;
    else if (length) bytes = length * (src.BYTES_PER_ELEMENT ?? 1);
    else
      bytes = src.byteLength - (srcOffset ?? 0) * (src.BYTES_PER_ELEMENT ?? 1);
    entryOf(t, buf, "buffer").parts = new Map([["s", bytes]]);
  });
  wrap("deleteBuffer", (_gl, t, [buf]) => forget(t, buf));
}

if (IS_LAB) install();

export interface VramReport {
  textures: number; // 이미지 텍스처 (모델 재질의 맵 등)
  renderTargets: number; // 프레임버퍼에 붙은 텍스처 + 렌더버퍼
  buffers: number; // 정점·인덱스·유니폼 버퍼
  canvas: number; // 캔버스 기본 프레임버퍼 (추정)
  unknownFormat: boolean;
}

export function getVram(gl: WebGL2RenderingContext): VramReport | null {
  const t = trackers.get(gl);
  if (!t) return null;
  let textures = 0;
  let renderTargets = 0;
  let buffers = 0;
  for (const e of t.entries.values()) {
    let s = 0;
    for (const v of e.parts.values()) s += v;
    if (e.kind === "buffer") buffers += s;
    else if (e.kind === "renderbuffer" || e.rt) renderTargets += s;
    else textures += s;
  }
  // 캔버스 자체 버퍼는 WebGL 호출 없이 브라우저가 만든다. 앞·뒤 색 버퍼(각 4B)와
  // 깊이(4B)로 추정하고, antialias면 뒤 버퍼를 샘플 수(4)만큼 곱한다.
  const attrs = gl.getContextAttributes();
  const px = gl.drawingBufferWidth * gl.drawingBufferHeight;
  const samples = attrs?.antialias ? 4 : 1;
  const canvas = px * (4 + (4 + (attrs?.depth ? 4 : 0)) * samples);
  return {
    textures,
    renderTargets,
    buffers,
    canvas,
    unknownFormat: t.unknownFormat,
  };
}
