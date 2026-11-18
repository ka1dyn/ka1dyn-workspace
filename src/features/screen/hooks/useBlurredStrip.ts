import { useEffect, useState } from "react";

interface StripOptions {
  /** 이미지가 object-cover로 채우는 영역 크기 (CSS px) */
  width: number;
  height: number;
  /** 위에서부터 잘라 낼 높이 (CSS px) */
  stripHeight: number;
  /** 흐림 반경 (CSS px, backdrop-blur 값과 같게) */
  blur: number;
  /** 검은 바탕 위에 이미지를 얹는 불투명도 */
  opacity: number;
}

const SCALE = 0.25; // 흐린 그림은 작게 만들어도 차이가 없다
const cache = new Map<string, string>();

// backdrop-filter: blur()를 대신할 "미리 흐려 둔 배경 조각"을 만든다.
// 영역 맨 위의 stripHeight만큼을 한 번만 흐려 data URL로 돌려준다 (이미지마다 한 번, 이후 캐시).
// backdrop-filter는 뒤 내용이 바뀔 때마다(여기서는 WebGL 캔버스 때문에 매 프레임) 다시 계산되지만,
// 이 조각은 그냥 이미지라서 매 프레임 비용이 없다.
function bake(img: HTMLImageElement, o: StripOptions) {
  const w = Math.round(o.width * SCALE);
  const h = Math.round(o.height * SCALE);
  const blur = o.blur * SCALE;

  // 1) object-cover로 채운 전체 그림 (검은 바탕 + 불투명도)
  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  const fctx = full.getContext("2d")!;
  fctx.fillStyle = "#000";
  fctx.fillRect(0, 0, w, h);
  fctx.globalAlpha = o.opacity;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  fctx.drawImage(
    img,
    (img.naturalWidth - sw) / 2,
    (img.naturalHeight - sh) / 2,
    sw,
    sh,
    0,
    0,
    w,
    h,
  );

  // 2) 위쪽 조각만 흐린다. 가장자리가 어두워지지 않도록 바깥을 거울상으로 채운다
  //    (브라우저의 backdrop-filter도 가장자리를 거울상으로 처리한다).
  const strip = document.createElement("canvas");
  strip.width = w;
  strip.height = Math.max(1, Math.round(o.stripHeight * SCALE));
  const sctx = strip.getContext("2d")!;
  if (typeof sctx.filter === "string") sctx.filter = `blur(${blur}px)`;
  for (const mx of [-1, 0, 1])
    for (const my of [-1, 0]) {
      sctx.save();
      // 뒤집은 그림이 원본의 왼쪽(-w~0)·오른쪽(w~2w)·위(-h~0)에 놓이게 한다
      sctx.translate(mx > 0 ? 2 * w : 0, 0);
      sctx.scale(mx === 0 ? 1 : -1, my === 0 ? 1 : -1);
      sctx.drawImage(full, 0, 0);
      sctx.restore();
    }
  return strip.toDataURL("image/jpeg", 0.9);
}

export default function useBlurredStrip(src: string | null, o: StripOptions) {
  const key = src
    ? `${src}|${o.width}|${o.height}|${o.stripHeight}|${o.blur}|${o.opacity}`
    : null;
  const [ready, setReady] = useState<string | null>(null);

  useEffect(() => {
    if (!src || !key || cache.has(key)) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      cache.set(key, bake(img, o));
      if (alive) setReady(key);
    };
    img.src = src;
    return () => {
      alive = false;
    };
    // o의 값은 key에 들어 있다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, key]);

  // ready는 다시 렌더링하게 하는 용도다. 값은 캐시에서 읽는다
  void ready;
  return key ? (cache.get(key) ?? null) : null;
}
