import Booting from "./components/Booting";
import Home from "./components/Home";
import { useCameraInit, useOverlay, useReady, useDive, OverlayTypes } from "@/shared/stores";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  ASPECT_EPSILON,
  SCREEN_DISTANCE_FACTOR,
  SCREEN_PX,
  SCREEN_WORLD,
} from "./constants";
import { fitDistance } from "./utils/fitDistance";
import * as THREE from "three";
import { useShallow } from "zustand/shallow";
import { useLab } from "@/features/lab/store";
import { ScreenImpostor } from "./utils/ScreenImpostor";

// 화면 높이가 이 값(CSS px)보다 작게 보이면 대체 그림으로 바꾸고, 더 크게 보이면 DOM으로 돌아온다.
// 전체 장면 시점에서는 약 30px이다. 두 값 사이에서는 지금 상태를 유지한다.
const LOD_FAR_PX = 110;
const LOD_NEAR_PX = 140;
const LOD_FADE_SECONDS = 0.25;

// 화면 평면 두 장(drei Html의 구멍 평면 → 필름 평면 순)을 다른 불투명 물체보다 먼저 그린다.
// three는 불투명 물체를 물체 중심 거리로 정렬해서, 중심이 더 가까운 맥북 상판이 먼저 그려졌다.
// 그러면 화면 뒤에 가려질 상판 픽셀까지 PBR로 전부 계산한 뒤 평면이 덮어쓴다
// (맥북 정면에서 프레임의 90%, 측정 약 840mW). 평면이 먼저 깊이를 채우면 뒤쪽 픽셀은 깊이 테스트에서 걸러진다.
// 필름 평면은 구멍 평면의 알파를 그대로 덮어써야 하므로 구멍 평면보다 뒤에 그린다.
const HOLE_RENDER_ORDER = -2;
const FILM_RENDER_ORDER = -1;

type screenProps = React.JSX.IntrinsicElements["group"];

export default function Screen({ ...props }: screenProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const { setTarget, setCameraPos } = useCameraInit(
    useShallow((state) => ({
      setTarget: state.setTarget,
      setCameraPos: state.setPos,
    })),
  );
  const screenReady = useReady((state) => state.screenReady);
  const dive = useDive((state) => state.dive);
  const type = useOverlay((state) => state.type);
  const lab = useLab((state) => state.screen);
  // 해상도 배율을 낮추면 CSS 크기는 줄이고 distanceFactor는 키워, 월드에서 보이는 크기는 그대로 둔다.
  const screenPx = { w: SCREEN_PX.w * lab.res, h: SCREEN_PX.h * lab.res };

  const { size } = useThree();
  const lastAspect = useRef(0);

  // Place the camera on the screen's normal, far enough back that the monitor
  // fills SCREEN_FILL of the frame. Distance rather than FOV does the fitting,
  // so the room behind the monitor keeps a natural perspective on every aspect.
  useEffect(() => {
    const aspect = size.width / size.height;

    // Hysteresis: the mobile URL bar sliding in and out fires a resize on every
    // scroll. Without this the camera breathes.
    if (
      lastAspect.current &&
      Math.abs(aspect - lastAspect.current) < ASPECT_EPSILON
    ) {
      return;
    }
    lastAspect.current = aspect;

    const worldPosition = new THREE.Vector3();

    groupRef.current.updateWorldMatrix(true, false);
    groupRef.current.getWorldPosition(worldPosition);

    setTarget({
      x: worldPosition.x,
      y: worldPosition.y,
      z: worldPosition.z,
    });

    const direction = new THREE.Vector3();
    groupRef.current.getWorldDirection(direction);

    const distance = fitDistance(
      SCREEN_WORLD.w / 2,
      SCREEN_WORLD.h / 2,
      aspect,
    );
    const cameraPos = worldPosition
      .clone()
      .addScaledVector(direction, distance);

    setCameraPos({
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
    });
  }, [groupRef, size.width, size.height, setTarget, setCameraPos]);

  // ---- 보호필름 효과 + 거리별 화면 대체(LOD) ----
  //
  // 화면은 캔버스 뒤에 놓인 DOM이고, 캔버스에는 그 자리에 알파 0인 구멍이 뚫려 있다 (occlude="blending").
  // 그 구멍 바로 앞에 평면 하나를 그려 두 가지 일을 한다:
  //   1) 보호필름: 비스듬히 보거나 멀어지면 화면이 어두워지는 효과. 예전에는 DOM에 매 프레임
  //      filter: brightness()와 opacity를 써서, 카메라가 움직이면 2560×1700 내용을 다시 그렸다 (전력 10W 이상).
  //      지금은 평면이 검은색을 알파 (1 - 밝기)로 내보낸다. 브라우저가 캔버스를 DOM 위에 합성할 때
  //      DOM × 밝기가 되므로 결과는 같고, DOM 스타일은 건드리지 않는다.
  //   2) LOD: 화면이 작게 보이면 DOM을 숨기고 같은 평면에 대체 그림(ScreenImpostor)을 그린다.
  //      DOM이 화면에 없으면 브라우저가 창 전체를 매 프레임 합성하지 않아도 된다.
  // 출력은 미리 곱한 알파: rgb = 그림 × 밝기 × mix, 알파 = mix + (1 - mix)(1 - 밝기)
  //   → 최종 색 = 밝기 × (그림 × mix + DOM × (1 - mix)). mix가 0↔1로 움직이는 동안 자연스럽게 겹쳐 바뀐다.
  const impostor = useMemo(() => new ScreenImpostor(), []);
  const filmMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: impostor.texture },
          uK: { value: 1 },
          uMix: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uK;
          uniform float uMix;
          varying vec2 vUv;
          void main() {
            vec3 c = uMix > 0.0 ? texture2D(uMap, vUv).rgb : vec3(0.0);
            gl_FragColor = vec4(c * uK * uMix, uMix + (1.0 - uMix) * (1.0 - uK));
          }
        `,
        blending: THREE.NoBlending,
        // drei의 구멍 평면과 같은 자리라서 깊이 싸움이 나지 않게 앞으로 당긴다
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      }),
    [impostor],
  );
  useEffect(
    () => () => {
      impostor.dispose();
      filmMaterial.dispose();
    },
    [impostor, filmMaterial],
  );

  const filmRef = useRef<THREE.Mesh>(null!);
  const lod = useRef({
    world: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    toCamera: new THREE.Vector3(),
    ndc: new THREE.Vector3(),
    far: false, // 대체 그림을 쓸 거리인지 (경계에서 깜빡이지 않게 이력을 둔다)
    mix: 0, // 0 = DOM, 1 = 대체 그림
    domHidden: false,
    domK: -1,
  });

  // 이전 방식(DOM filter)을 끄면 남은 스타일을 지운다
  useEffect(() => {
    lod.current.domK = -1;
    if (lab.filmDom && lab.frameStyle) return;
    if (!contentRef.current) return;
    contentRef.current.style.filter = "";
    contentRef.current.style.opacity = "";
  }, [lab.filmDom, lab.frameStyle, lab.html]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const film = filmRef.current;
    if (!group || !film) return;
    const s = lod.current;
    const camera = state.camera as THREE.PerspectiveCamera;

    // drei Html은 구멍 평면의 renderOrder를 받지 않고, dive를 오가면 평면을 새로 만든다.
    // 그래서 매 프레임 Html 그룹(필름 평면 외의 자식) 안의 평면에 값을 넣는다 (자식은 몇 개뿐이다).
    // 그룹은 필름 평면의 부모로 찾는다 (groupRef는 effect 의존성이라 거기서 꺼내 고치면 React 컴파일러 규칙에 걸린다)
    for (const child of film.parent?.children ?? []) {
      if (child === film) continue;
      for (const m of child.children)
        if ((m as THREE.Mesh).isMesh) m.renderOrder = HOLE_RENDER_ORDER;
    }

    group.updateWorldMatrix(true, false);
    group.getWorldPosition(s.world);
    group.getWorldDirection(s.normal);
    s.toCamera.copy(camera.position).sub(s.world);
    const distance = s.toCamera.length();
    s.toCamera.divideScalar(Math.max(distance, 1e-6));

    // 밝기: 정면에서 벗어날수록, 멀어질수록 어두워진다 (10m에서 절반)
    const dot = Math.max(0, s.normal.dot(s.toCamera));
    const fade = Math.max(0, 1 - 0.05 * distance);
    // 예전: brightness(dot) 다음 opacity(dot × fade)를 검은 배경 위에 → 내용 × dot² × fade
    const k = lab.frameStyle ? dot * dot * fade : 1;

    const { dive } = useDive.getState();
    const overlayType = useOverlay.getState().type;

    // 화면이 차지하는 높이(CSS px)와 화면 안에 있는지
    const pxH =
      (SCREEN_WORLD.h * state.size.height) /
      (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    s.ndc.copy(s.world).project(camera);
    const offscreen =
      Math.abs(s.ndc.x) > 1.4 || Math.abs(s.ndc.y) > 1.4 || s.ndc.z > 1;

    if (!lab.lod || dive || overlayType === OverlayTypes.SCREEN) s.far = false;
    else if (offscreen || k < 0.004 || pxH < LOD_FAR_PX) s.far = true;
    else if (pxH > LOD_NEAR_PX) s.far = false;

    const step = delta / LOD_FADE_SECONDS;
    s.mix = s.far ? Math.min(1, s.mix + step) : Math.max(0, s.mix - step);
    if (s.mix > 0) impostor.update();

    // 대체 그림으로 완전히 바뀌면 DOM을 숨긴다 (레이아웃은 그대로라 다시 켤 때 바로 나온다)
    const hide = s.mix >= 1;
    if (hide !== s.domHidden) {
      s.domHidden = hide;
      const root = contentRef.current?.closest<HTMLElement>(".screen-html");
      if (root) root.style.visibility = hide ? "hidden" : "";
    }

    const domFilm = lab.filmDom && lab.frameStyle;
    // 재질은 메시에서 꺼내 쓴다 (useMemo 값을 직접 고치면 React 컴파일러 규칙에 걸린다)
    const u = (film.material as THREE.ShaderMaterial).uniforms;
    u.uK.value = domFilm ? 1 : k;
    u.uMix.value = s.mix;
    film.visible = !dive;

    // 이전 방식 (실험실 비교용): DOM에 직접 filter·opacity를 쓴다
    if (domFilm && contentRef.current && Math.abs(k - s.domK) > 1e-4) {
      s.domK = k;
      contentRef.current.style.filter = `brightness(${dot})`;
      contentRef.current.style.opacity = (dot * fade).toString();
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {lab.html && (
        <mesh
          ref={filmRef}
          material={filmMaterial}
          renderOrder={FILM_RENDER_ORDER}
        >
          <planeGeometry args={[SCREEN_WORLD.w, SCREEN_WORLD.h]} />
        </mesh>
      )}
      {lab.html && (
        <Html
          wrapperClass="screen-html"
          className={`overflow-hidden ${!dive && "rounded-4xl"} ${type !== OverlayTypes.SCREEN && "select-none"} ${!dive && !lab.backdrop && "screen-noblur"}`}
          style={dive ? undefined : { width: screenPx.w, height: screenPx.h }}
          pointerEvents={type === OverlayTypes.SCREEN ? "auto" : "none"}
          {...(dive
            ? {
                fullscreen: true,
              }
            : {
                transform: true,
                distanceFactor: SCREEN_DISTANCE_FACTOR / lab.res,
                occlude: lab.occlude ? "blending" : undefined,
              })}
        >
          <div
            ref={contentRef}
            className="w-full h-full @container-[size] font-pretendard"
          >
            {screenReady ? <Home /> : <Booting />}
          </div>
        </Html>
      )}
    </group>
  );
}
