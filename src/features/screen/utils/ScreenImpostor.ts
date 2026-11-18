import { PUBLIC_IMAGES } from "@/shared/constants/images";
import { SCREEN_PX } from "@/shared/constants/camera";
import { useReady } from "@/shared/stores";
import { useBgImageStore, useModalStore, useModalViewStore } from "../stores";
import * as THREE from "three";

// 멀리서 보는 맥북 화면의 대체 그림.
//
// 맥북 화면은 실제 DOM(2560×1700)을 drei Html로 3D에 겹친 것이라, 화면에 40픽셀 폭으로 작게 보일 때도
// 브라우저가 매 프레임 창 전체를 직접 합성해야 한다 (DOM이 없으면 캔버스를 그대로 화면에 올리는 빠른 경로를 쓴다).
// 측정: DOM을 숨기기만 해도 GPU 전력이 약 2.3W → 1.3W (blur가 켜져 있으면 4.8W → 1.3W).
//
// 그래서 화면이 작게 보일 때는 DOM을 숨기고, 같은 자리에 이 텍스처를 붙인 평면을 그린다.
// 그림은 스토어 상태(배경 이미지, 열린 창의 위치·크기)로 2D 캔버스에 직접 그린다.
// 작게 보일 때만 쓰므로 글자·내용까지 옮기지 않고 큰 덩어리(배경, 상단 바, 폴더, 독, 창)만 맞춘다.

const W = 640; // 텍스처 크기 (화면 DOM의 1/4)
const H = Math.round((W * SCREEN_PX.h) / SCREEN_PX.w);
const S = W / SCREEN_PX.w; // DOM px → 텍스처 px

// Home.tsx의 clamp(…, 100cqh / 1080px, …) 배율. 3D 화면은 높이가 항상 1700이라 상수다.
const FOLDER_SCALE = Math.min(Math.max(SCREEN_PX.h / 1080, 0.6), 1.5);
const DOCK_SCALE = Math.min(Math.max(SCREEN_PX.h / 1080, 0.7), 1.6);

const images = new Map<string, HTMLImageElement>();
function image(src: string, onLoad: () => void) {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    images.set(src, img);
  }
  if (!img.complete) img.addEventListener("load", onLoad, { once: true });
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// object-fit: cover
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(
    img,
    (img.naturalWidth - sw) / 2,
    (img.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h,
  );
}

export class ScreenImpostor {
  readonly texture: THREE.CanvasTexture;
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private dirty = true;
  private readonly unsubscribe: (() => void)[];

  constructor() {
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    // 색 변환 없이 그대로 내보낸다 (DOM과 같은 sRGB 값이 화면에 나온다)
    this.texture.colorSpace = THREE.NoColorSpace;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.anisotropy = 4;

    const mark = () => (this.dirty = true);
    this.mark = mark;
    this.unsubscribe = [
      useBgImageStore.subscribe(mark),
      useModalStore.subscribe(mark),
      useModalViewStore.subscribe(mark),
      useReady.subscribe(mark),
    ];
  }

  private readonly mark: () => void;

  /** 상태가 바뀌었을 때만 다시 그린다. 대체 그림이 보일 때만 부르면 된다. */
  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.draw();
    this.texture.needsUpdate = true;
  }

  private draw() {
    const { ctx, mark } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    // 모서리 밖은 화면 뒤 페이지 배경색 (App.tsx)
    ctx.fillStyle = "#010203";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // 이후는 DOM px 좌표로 그린다
    ctx.scale(S, S);
    const w = SCREEN_PX.w;
    const h = SCREEN_PX.h;
    roundRect(ctx, 0, 0, w, h, 26); // rounded-4xl
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    if (!useReady.getState().screenReady) {
      // 부팅 화면: 검은 바탕에 로고
      const logo = image(PUBLIC_IMAGES.LOGO, mark);
      if (logo) {
        const lw = 384;
        const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
        ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh);
      }
      ctx.restore();
      return;
    }

    // 배경 이미지 (opacity-60)
    const bg = image(useBgImageStore.getState().path, mark);
    if (bg) {
      ctx.globalAlpha = 0.6;
      drawCover(ctx, bg, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // 상단 바 (h-16, bg-gray-500/60)
    ctx.fillStyle = "rgba(106, 114, 130, 0.6)";
    ctx.fillRect(0, 0, w, 64);
    const logo = image(PUBLIC_IMAGES.LOGO, mark);
    if (logo)
      ctx.drawImage(
        logo,
        16,
        0,
        (64 * logo.naturalWidth) / logo.naturalHeight,
        64,
      );

    // 폴더 두 개 (right-5 top-25 w-40, 오른쪽 위 기준 배율)
    const folder = image(PUBLIC_IMAGES.FOLDER, mark);
    ctx.save();
    ctx.translate(w - 20, 100);
    ctx.scale(FOLDER_SCALE, FOLDER_SCALE);
    ["about_me", "projects"].forEach((name, i) => {
      const top = i * 134; // 아이콘 칸 92 + 이름 + 간격 20
      if (folder) {
        const fh = (80 * folder.naturalHeight) / folder.naturalWidth;
        ctx.drawImage(folder, -120, top + (92 - fh) / 2, 80, fh);
      }
      ctx.fillStyle = "#fff";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, -80, top + 112);
    });
    ctx.restore();

    // 열린 창 (아래에 있는 것부터)
    const modals = Object.values(useModalStore.getState().modals);
    const rects = useModalViewStore.getState().rects;
    [...modals]
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach((m) => {
        if (m.isDown) return;
        const r = rects[m.name];
        const x = m.isFull ? 0 : (r?.x ?? 0);
        const y = m.isFull ? 0 : (r?.y ?? 0);
        const mw = m.isFull ? w : (r?.width ?? 1400);
        const mh = m.isFull ? h : (r?.height ?? 1100);
        ctx.save();
        roundRect(ctx, x, y, mw, mh, m.isFull ? 0 : 16);
        ctx.clip();
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, mw, mh);
        // 제목 줄과 신호등 버튼
        ctx.fillStyle = "#ececec";
        ctx.fillRect(x, y, mw, 88);
        if (m.name === "projects") {
          ctx.fillStyle = "#d6d6d6";
          ctx.fillRect(x, y, 300, mh);
        }
        ["rgb(255,95,87)", "rgb(255,188,46)", "rgb(43,200,64)"].forEach(
          (c, i) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(x + 48 + i * 32, y + 44, 10, 0, Math.PI * 2);
            ctx.fill();
          },
        );
        // 본문은 옅은 줄 몇 개로만 표시한다
        ctx.fillStyle = "#d9d9d9";
        const left = x + (m.name === "projects" ? 380 : 110);
        for (let ly = y + 150; ly < y + mh - 60; ly += 70)
          ctx.fillRect(left, ly, (mw - (left - x) - 110) * 0.8, 14);
        ctx.restore();
      });

    // 독 (아래 가운데 기준 배율): 배경 3개 썸네일 + 열린 창 아이콘
    const dockW =
      16 * 2 + 64 * 3 + 24 * 2 + (modals.length ? 50 : 0) + modals.length * 88;
    ctx.save();
    ctx.translate(w / 2, h);
    ctx.scale(DOCK_SCALE, DOCK_SCALE);
    ctx.fillStyle = "rgba(106, 114, 130, 0.5)";
    roundRect(ctx, -20, -108, 40, 80, [20, 20, 0, 0]); // 접기 버튼
    ctx.fill();
    roundRect(ctx, -dockW / 2, -88, dockW, 88, [16, 16, 0, 0]);
    ctx.fill();
    [
      PUBLIC_IMAGES.DOG_THUMBNAIL,
      PUBLIC_IMAGES.BIKE_THUMBNAIL,
      PUBLIC_IMAGES.CITY_THUMBNAIL,
    ].forEach((src, i) => {
      const thumb = image(src, mark);
      const x = -dockW / 2 + 16 + i * 88;
      ctx.save();
      roundRect(ctx, x, -80, 64, 64, 12);
      ctx.clip();
      if (thumb) drawCover(ctx, thumb, x, -80, 64, 64);
      ctx.restore();
    });
    modals.forEach((_, i) => {
      ctx.fillStyle = "#fff";
      roundRect(ctx, -dockW / 2 + 16 + 3 * 88 + 26 + i * 88, -80, 64, 64, 12);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }

  dispose() {
    this.unsubscribe.forEach((f) => f());
    this.texture.dispose();
  }
}
