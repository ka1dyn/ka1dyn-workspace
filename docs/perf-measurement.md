# 성능 측정 정리 (GPU 시간 · 프레임 한계 · 적응형 품질 · 페이지 간 비교)

> 작성일 2026-11-05 · 브랜치 `feat/gpu-frame-timer`
> 환경: three 0.181.2, @react-three/fiber 9, drei 10.7, stats-gl 2.4.2, r3f-perf 7.2.3, macOS + Chrome

---

## 1. 배경: Chrome 에너지 절약 모드는 30fps로 고정된다

- Chromium 소스 `chrome/browser/performance_manager/user_tuning/battery_saver_mode_manager.cc`
  ```cpp
  void StartThrottlingAllFrameSinks() override {
    content::StartThrottlingAllFrameSinks(base::Hertz(30));
  }
  ```
  에너지 절약 모드가 **실제로 동작하면** 모든 화면 출력이 30Hz로 제한된다. `requestAnimationFrame` 기반인 R3F 렌더 루프도 30fps가 된다.
- **켜지는 조건**(Google 도움말): 전원이 빠졌거나 배터리가 부족할 때. 전원이 연결돼 있으면 켜지지 않는다. 설정은 `chrome://settings/performance`에 있다.
- **테스트 방법**: `chrome://flags/#battery-saver-mode-available`을 켠 뒤 `chrome://discards`에서 "Toggle battery saver mode"를 누른다. 전원을 뽑지 않아도 된다.
- **iOS 저전력 모드**에서도 rAF와 CSS 애니메이션이 30fps로 떨어진다는 보고가 있다(WebKit). iOS의 Chrome도 WebKit을 쓴다.
- 절전 모드에서는 **GPU 시간이 늘어난다**(r3f-perf로 관찰). 그려야 할 양이 늘어서가 아니다. 프레임이 줄면 GPU가 쉬는 시간이 늘고, OS와 드라이버가 클럭을 낮춰서 같은 작업이 더 오래 걸린다. (추정, 미검증. `sudo powermetrics --samplers gpu_power`로 확인 가능)

---

## 2. 기존 라이브러리 비교: stats-gl vs r3f-perf

둘 다 같은 하드웨어 타이머(`EXT_disjoint_timer_query_webgl2`, `TIME_ELAPSED_EXT`)를 쓴다. **타이머 정밀도는 같고, 무엇을, 언제, 어떻게 평균 내느냐가 다르다.**

| | stats-gl 2.4.2 | r3f-perf 7.2.3 |
|---|---|---|
| GPU 측정 구간 | `renderer.render` 자체를 패치 | `Scene.onBeforeRender` ~ `onAfterRender` |
| 쿼리 방식 | 렌더 호출마다 1개, 결과를 **합산** | 동시에 **1개만**. 결과가 나와야 다음 쿼리 시작 → 일부 렌더를 놓침 |
| 결과 없는 프레임 | 0으로 기록되고, 나중에 몰려 들어온 결과가 합산됨 → 튀지만 평균은 보존 | `gpuAccums`를 0으로 초기화 → **0이 평균에 섞임** |
| 평균 방식 | 최근 60 샘플 이동평균 | 100ms 구간 평균 |
| CPU 측정 구간 | 첫 `renderer.render` ~ after-effect | `addEffect`(모든 `useFrame` 이전) ~ after-effect → 더 넓음 |
| 값 읽기 API | drei `StatsGl` ref는 **DOM 요소**만 돌려줌. 값을 쓰려면 직접 인스턴스를 만들고 내부 속성을 읽어야 함 | `getPerf().log`, `PerfHeadless` 공식 제공 |

### 실측 (에너지 절약 모드, 각각 따로 측정)

| 도구 | FPS | CPU | GPU |
|---|---|---|---|
| stats-gl | 30 | 2.4ms | 13ms |
| r3f-perf | 29~33 | 4~5ms | 16~27ms |
| GpuTimer (직접 구현) | 30 | | **13.5ms** |

- **FPS 차이**: r3f-perf는 100ms 구간(30fps에서 약 3프레임)으로 평균 내서 숫자가 출렁인다.
- **CPU 차이**: 측정 구간이 다르다. r3f-perf가 `useFrame`까지 포함해서 더 크다.
- **GPU 차이**: GpuTimer와 stats-gl이 일치한다. r3f-perf가 **더 높게** 나온 원인은 **아직 밝히지 못했다**. 빈 프레임에 0이 섞이는 건 값을 낮추는 쪽이라 원인이 될 수 없다.
  - 가능성(추정): macOS Chrome의 타이머는 커맨드 버퍼 경과 시간을 합산한다(8장). r3f-perf는 `Scene.onBeforeRender`에서 쿼리를 걸기 때문에 커맨드 버퍼가 끊기는 위치가 stats-gl과 다르고, 그 차이로 값이 달라졌을 수 있다.

### 동시에 켜면 안 된다

WebGL2는 `TIME_ELAPSED` 쿼리를 **동시에 하나만** 허용한다. stats-gl은 `render`를 바깥에서, r3f-perf는 안쪽에서 감싸기 때문에 이렇게 꼬인다.

- r3f-perf의 `beginQuery`가 `INVALID_OPERATION`으로 실패한다.
- r3f-perf가 stats-gl의 쿼리를 대신 종료해버린다.
- 그 결과 stats-gl의 `endQuery`도 `INVALID_OPERATION`으로 실패한다.

→ GPU 시간을 잴 때는 **한 가지 도구만** 켠다. `GpuTimer`는 이런 충돌을 감지하면 `conflicts`로 표시한다.

### 정정 사항

초기 분석에서는 거울 렌더(`Ground/index.tsx`의 `mirrorTexture.render`)가 매 프레임 실행된다고 봤다. 실제로는 `Ground`가 사용되지 않는 `TmpModels.tsx`에만 있다. **현재 매 프레임 렌더 패스는 메인 화면 렌더 1개뿐이다.**

---

## 3. GpuTimer 설계 (`src/3d-components/GpuTimer.tsx`)

- **프레임 경계**: R3F의 `addEffect`(모든 `useFrame` 이전)에서 프레임을 열고, `addAfterEffect`(렌더 이후)에서 닫는다.
- **GPU**: 그 사이 모든 최상위 `renderer.render` 호출을 각각 `TIME_ELAPSED` 쿼리로 감싸고 프레임 단위로 합산한다. 중첩 렌더는 바깥 쿼리에 포함된다.
- **확정 조건**: 프레임의 **모든 패스 결과가 모였을 때만** 집계한다. 결과가 덜 모인 프레임은 집계하지 않는다.
- **무효 처리**
  - `GPU_DISJOINT_EXT`가 true(GPU 클럭이나 전원 상태 변경 등): 그 시점에 결과를 기다리던 쿼리를 전부 버리고, 해당 프레임은 discarded로 센다.
  - 다른 타이머와의 충돌: 해당 프레임을 무효로 하고 conflicts로 센다.

### 오버레이 지표

| 지표 | 의미 |
|---|---|
| `FRAME` | rAF 간격 중앙값 → 실제 프레임 한계(Hz)와 프레임 예산, 그리고 판정 |
| `GPU` avg/p95/min/max, util | 프레임당 GPU 합계 분포, 예산 대비 사용률 |
| `CPU` avg/p95, util | `addEffect`부터 after-effect까지. 모든 `useFrame`과 렌더 명령 제출을 포함 |
| p95 | 프레임의 95%가 이 시간 안에 끝났다는 뜻. avg와 차이가 크면 가끔 튀는 무거운 프레임이 있다. 30fps에서 1초 집계면 샘플이 30개라서 사실상 두 번째로 큰 값이다 |
| `#0 screen` / `RT WxH` | 렌더 패스. 렌더 타깃이 없으면 `screen`(캔버스), 있으면 `RT` + 해상도. `#n`은 그 프레임에서 몇 번째 호출인지, `(Nx)`는 등장한 프레임 수 |
| `DRAW` | 프레임당 드로우콜, 삼각형, 정점, 선, 점 수(모든 패스 합산) |
| `MEM` | GPU에 올라간 지오메트리·텍스처 개수, 셰이더 프로그램 수, JS 힙 크기(Chrome 전용) |
| `SYS` | Compute Pressure API의 시스템 CPU 압력 상태(`nominal`/`fair`/`serious`/`critical`). 미지원이면 `n/a` (7장 참고) |
| `discarded` | 측정은 됐지만 믿을 수 없어서 버린 프레임 수 (disjoint, 충돌, 대기 쿼리가 쌓여 넘친 경우) |
| `conflicts` | 다른 GPU 타이머와 쿼리가 겹친 횟수(렌더 호출 단위). **항상 0이어야 한다** |

**측정 범위**
- 포함: `renderer.render`로 그린 모든 패스. 그림자맵, 배경, 렌더 타깃 패스 포함.
- 제외: `render` 밖의 GL 작업, 브라우저 합성 단계.
- 타이머 쿼리 기반이므로 GPU 클럭 변화나 ANGLE(Metal) 구현의 영향은 그대로 받는다.

### 현재 알려진 한계 (12장 로드맵에서 개선 예정)

- **루프 밖 렌더를 별도 프레임으로 기록함**: React 커밋(`useLayoutEffect` 등)에서 생긴 렌더가 독립된 임시 프레임으로 기록된다. 그래서 GPU 통계의 프레임 수가 실제 rAF 프레임 수와 다를 수 있다.
- **임시 프레임의 `DRAW` 값 오염(버그)**: 위의 임시 프레임에는 직전 프레임의 `gl.info` 값이 섞인다. 프레임이 끝날 때 `gl.info`를 초기화하지 않기 때문이다.
- **macOS에서 패스가 많을수록 GPU 값이 부풀려짐**: 8장 참고. 패스가 1개일 때는 실제와 비슷했다(13.5 vs 14.4ms).

---

## 4. 프레임 한계(cap) 판별

### API로 알 수 없는 것

| 알고 싶은 것 | API | 비고 |
|---|---|---|
| Chrome 에너지 절약 모드 여부 | 없음 | Chrome 공식: "개발자가 따로 대응할 필요 없다" |
| 모니터 주사율 | 없음 | Chrome 공식: *"There is no dedicated web API to measure display refresh rate."* |
| iOS·macOS 저전력 모드 | 없음 | |
| 배터리 상태 | `navigator.getBattery()` | Chrome에서 HTTPS일 때만 동작. 충전 여부와 잔량만 알려주고, 절전 모드 설정은 알 수 없음 |

`prefers-reduced-motion`은 접근성 설정이라 절전 모드와 관계없다.

### 측정으로 추정하기

rAF 간격의 중앙값이 **실제 프레임 한계**다. 원인이 무엇이든 이 값이 곧 프레임 예산이다.

| 상황 | rAF 간격 |
|---|---|
| 60 / 120 / 144Hz 모니터 | 16.7 / 8.3 / 6.9ms |
| Chrome 에너지 절약 모드 | 33.3ms (30Hz, 소스로 확인) |
| iOS 저전력 모드 | 30fps 보고 있음 |
| 가변 주사율(ProMotion 등) | 상황에 따라 바뀜 (정확한 동작은 미확인) |
| 창을 다른 모니터로 이동 | 그 모니터의 주사율로 바뀜 |
| 백그라운드 탭 | rAF가 거의 정지 (`visibilitychange`로 감지) |
| 장면이 무거움 | 간격이 불규칙하게 늘어남 (16.7과 33이 섞이는 식) |

**원인을 구분하는 방법**
- **한계에 막힘**: 간격이 일정한데 CPU·GPU 작업 시간이 예산보다 훨씬 짧다. 여유가 있다는 뜻이다.
- **부하 때문**: 작업 시간이 예산에 가깝고 간격이 들쭉날쭉하다. 품질을 낮춰야 한다.

**주의**
- 주사율은 창 이동이나 전원 연결·해제로 언제든 바뀐다. **계속 측정**해야 한다.
- Chrome은 주사율을 재려고 rAF 루프를 따로 돌리지 말라고 권한다(배터리 낭비). 3D 앱은 이미 rAF가 돌고 있어서 추가 비용이 거의 없다.

---

## 5. 적응형 품질 조절 권장안

- **drei `PerformanceMonitor`는 FPS만 본다.** 기본 bounds가 `refreshrate > 100 ? [60, 100] : [40, 60]`이라, 절전 모드의 30fps에서는 GPU가 13.5ms/33ms로 여유가 있어도 **계속 `onDecline`이 호출된다.**
- **권장 방식**
  - 주 신호: **GPU 사용률 = GPU 시간 ÷ 실제 프레임 예산**. 예: 80%를 넘으면 낮추고, 50% 밑이면 올린다.
  - 보조 신호: GPU 타이머 확장을 지원하지 않는 환경에서는 FPS나 rAF 간격으로 판단한다.
  - **GPU 타이머만 믿지 않는다**: macOS Chrome에서는 렌더 호출이 많아지면 GPU 값이 실제의 2배 이상으로 나올 수 있다(8장, 9장). 품질을 내리기 전에 **FRAME 간격(p95)이 실제로 예산을 넘는지** 함께 확인한다. 9장 사례에서도 타이머는 30ms 이상이었지만 60fps는 유지됐다.
- **흔들림 방지**
  - 조건이 일정 시간 연속으로 유지될 때만 바꾼다.
  - 한 번 바꾼 뒤 몇 초간은 다시 안 바꾼다(쿨다운).
  - 내리는 기준과 올리는 기준 사이에 간격을 둔다(히스테리시스).
- **조절 순서**
  1. 빗방울 수: 인스턴싱이면 `mesh.count`만 바꾸면 된다. 비용이 거의 없다.
  2. dpr: 바꿀 때 캔버스가 리사이즈돼서 순간 끊김이 생긴다. 마지막 단계로 둔다. 기존 `lowDpr` 스토어(`src/stores.ts`, `Scene.tsx`의 `dpr={lowDpr ? 0.6 : [1, 1.5]}`)를 활용한다.
- `GpuTimer`의 `onReport` 콜백으로 위 판단 로직을 연결할 수 있다. `report.verdict`, `gpuUtil`, `cpuUtil`, `pressure`를 신호로 쓴다.
- 보조 신호: `pressure`가 `serious` 이상이면 사용률이 오르기 전에 미리 품질을 낮춘다(7장).

### GpuTimer API

```tsx
<GpuTimer
  intervalMs={1000}      // 집계·보고 주기
  overlay                // 좌하단 텍스트 오버레이 (기본 true)
  log={false}            // 콘솔 출력
  onReport={(r) => {}}   // FrameReport: frame, gpu, cpu, gpuUtil, cpuUtil, verdict, passes, draw, memory, pressure, discarded, conflicts
/>
```

GPU 타이머 확장이 없는 환경에서도 GPU를 뺀 나머지 지표는 동작한다.

---

## 6. 측정 가능한 지표와 한계

**three.js가 세는 값** (`gl.info`, `WebGLInfo.js`)
- `render.calls`, `triangles`, `lines`, `points`
- `memory.geometries`, `memory.textures`, `programs.length`
- 기본 `autoReset: true`는 `render()`마다 카운터를 초기화한다. 프레임 단위 합계를 내려면 `autoReset = false`로 끄고 프레임 시작 시점에 직접 `reset()`해야 한다. r3f-perf와 GpuTimer 모두 이렇게 한다.

**직접 계산하는 값**
- **정점 수**: `renderBufferDirect`에서 `index.count` 또는 `position.count`에 drawRange, group, 인스턴스 수를 반영해서 계산한다.
- **텍스처 메모리 추정**: `TextureUtils.getByteLength(width, height, format, type)`. 밉맵과 드라이버 내부 사용량은 빠진 추정치다.
- **JS 힙**: `performance.memory` (Chrome 전용, 비표준).
- **행렬 업데이트 횟수**: `Object3D.prototype.updateMatrixWorld` 등을 패치해서 센다(r3f-perf 방식).
- **메시별 GPU 시간**: 오브젝트의 `onBeforeRender`/`onAfterRender`에 쿼리를 건다. 측정 자체가 부담이 되므로 필요할 때만 켜는 옵션으로 둔다.

**WebGL에서 측정 불가**
- 프래그먼트 셰이더 실행 횟수, 오버드로우 비율, 실제 GPU 메모리 사용량 같은 하드웨어 카운터.

**외부 도구**
- **Chrome DevTools Performance의 GPU 트랙**: GPU 프로세스 메인 스레드의 작업 목록이다. 흐름을 보기에는 좋지만 실제 GPU 실행 시간은 아니다.
- **`chrome://tracing` / Perfetto의 `disabled-by-default-gpu.device`**: GPU 타이머 기반 실행 시간을 기록한다. GL 컨텍스트가 GPU 타이밍을 지원할 때만 나오며, macOS(ANGLE/Metal)에서 동작하는지는 미확인이다.
- **Xcode Instruments의 Metal System Trace**: macOS에서 실제 GPU 실행 시간을 보는 가장 확실한 기준이다.

---

## 7. 발열(서멀 스로틀링)과 GPU 시간

기기가 뜨거워지면 OS와 드라이버가 온도를 낮추려고 GPU 클럭을 내린다. 그러면 **같은 장면을 그려도 GPU 시간이 늘어난다.** 냉각 여유가 작은 노트북과 모바일에서 특히 잘 일어난다. 원리는 에너지 절약 모드에서 GPU 시간이 늘어나는 것과 같다(클럭 하락).

### GpuTimer에서 보이는 모습

| 현상 | 해석 |
|---|---|
| `DRAW`(calls·tris·verts)는 그대로인데 GPU avg가 몇 분에 걸쳐 서서히 상승 | 클럭 하락. 발열 가능성이 높다 |
| `FRAME`이 33.3ms로 바로 바뀌면서 GPU 상승 | 에너지 절약 모드 (1장) |
| `discarded` 증가 | 클럭이 바뀌는 순간 `GPU_DISJOINT`가 날 수 있다. 다만 클럭 변화가 반드시 이 신호를 일으키는지는 드라이버마다 달라 미확인 |
| `SYS` pressure가 `serious` / `critical` | 시스템이 열이나 부하로 힘든 상태 |

**악순환 주의**: 30fps 고정이고 사용률이 낮으면 발열이 적다. 반면 한계까지 꽉 채워 돌면 발열 → 클럭 하락 → GPU 시간 증가로 이어질 수 있다.

### 확인 방법

- **macOS 터미널**
  - `pmset -g therm`: 열 때문에 성능 제한이 걸렸는지 표시한다.
  - `sudo powermetrics --samplers gpu_power,thermal`: GPU 주파수와 열 압력 수준을 실시간으로 보여준다. GpuTimer 값과 나란히 보면 클럭이 내려갈 때 GPU 시간이 오르는지 확인할 수 있다.
- **웹 API: Compute Pressure** (Chrome 125 이상, `'PressureObserver' in globalThis`로 지원 여부 확인)
  - `PressureObserver`로 `nominal` / `fair` / `serious` / `critical` 4단계 상태를 받는다. Chrome 문서상 열 상태도 반영된다.
  - 현재 지원 소스는 **`"cpu"`뿐**이다. GPU 소스는 없다.
  - 시스템 전체 상태라 다른 앱과 사이트의 영향도 받는다.
  - Permissions Policy(`compute-pressure`)로 막힐 수 있다.
  - → GPU 발열을 정확히 재는 용도가 아니라 **"기기가 힘든 상태"라는 보조 신호**로 쓴다.
  - GpuTimer는 이 값을 `SYS` 줄과 `report.pressure`로 노출한다. 미지원이거나 막히면 `n/a` / `null`.

### 측정과 품질 조절에 주는 의미

- **측정할 때**: 기기가 식은 직후와 몇 분 돌린 뒤의 값이 다르다. 비교할 때는 몇 분 워밍업한 뒤 재고, 같은 조건에서 반복 측정한다.
- **적응형 품질 조절**: GPU 사용률을 기준으로 잡으면 발열로 클럭이 내려간 상황도 자동으로 반영된다. Compute Pressure를 보조 신호로 같이 쓰면 더 빨리 반응할 수 있다.

---

## 8. macOS Chrome(ANGLE Metal) GPU 타이머의 실체

macOS의 Chrome은 WebGL을 **ANGLE의 Metal 백엔드**로 실행한다. `chrome://gpu`에서 `GL_RENDERER`에 `ANGLE Metal Renderer`가 있으면 해당된다(이 기기는 확인됨).

이 백엔드는 `TIME_ELAPSED` 쿼리를 GPU 하드웨어 타이머로 재지 않는다. **Metal 커맨드 버퍼의 경과 시간을 합산**한다.

```cpp
// ANGLE src/libANGLE/renderer/metal/QueryMtl.mm — beginQuery / endQuery
contextMtl->flushCommandBuffer(mtl::NoWait);   // 커맨드 버퍼를 강제로 끊음

// ANGLE src/libANGLE/renderer/metal/mtl_command_buffer.mm
// 쿼리가 켜져 있는 동안 만든 커맨드 버퍼가 완료되면
recordCommandBufferTimeElapsed(lg, timeElapsedEntry,
                               [buf GPUEndTime] - [buf GPUStartTime]);
entry.elapsed_seconds += seconds;              // 그대로 합산
```

**부풀림이 생기는 이유** (추정 포함)
- `GPUStartTime ~ GPUEndTime`은 그 커맨드 버퍼만 처리한 시간이 아니라 **경과 시간**이다. 그 사이에 브라우저 합성, 창 서버, 다른 탭의 GPU 작업이 끼어들었거나 대기한 시간도 들어갈 수 있다.
- 연속된 커맨드 버퍼가 GPU에서 일부 겹쳐 실행되면, 겹친 구간이 양쪽에 모두 들어갈 수 있다.
- begin/end마다 커맨드 버퍼가 끊기므로, **렌더 호출이 많을수록 작은 커맨드 버퍼가 많아지고** 각각의 경과 시간이 더해진다.

**검증 결과**
| 상황 | 타이머 (stats-gl/GpuTimer) | 실제 (powermetrics 환산) |
|---|---|---|
| 평소 (렌더 패스 1개) | 13~13.5ms | ≈ 14.4ms → **거의 일치** |
| intensity 조절 중 (패스 다수) | **30ms 이상** | ≈ 15ms → **약 2배 부풀림** |

**비교 실험**: `chrome://flags`의 "Choose ANGLE graphics backend"를 OpenGL로 바꿔서 다시 재보면 차이를 확인할 수 있다. (OpenGL 백엔드의 쿼리 구현은 소스로 확인하지 않았다.)

**결론**: macOS Chrome의 GPU 타이머는 **패스가 적을 때는 쓸 만하다.** 렌더 호출이 많아지면 실제 GPU 사용 시간이 아니라 "커맨드 버퍼 경과 시간의 합"이 된다. 정확한 기준이 필요하면 10장의 도구를 쓴다.

---

## 9. 사례: intensity 조절 시 RT 패스 급증

**현상**: intensity 슬라이더를 움직이면 `RT 256x256` 패스가 대량으로 생기고, GPU 타이머가 30ms를 넘는다. 그런데 30초 이상 계속 움직여도 60fps가 유지된다.

**원인** (코드로 확인)
1. `src/3d-components/Lights.tsx`가 `useTweaks((s) => s.intensity)`를 구독 → 슬라이더를 움직일 때마다 `Lights` 전체가 다시 렌더링된다.
2. `<Environment frames={1}>`의 `Lightformer` 자식들이 새 JSX로 넘어간다. drei `core/Environment.js`의 `EnvironmentPortal`은 `useLayoutEffect(..., [children, ...])`에서 `frames === 1`이면 `cubeCamera.update()`를 실행한다. intensity는 `rectAreaLight` 값이라 환경맵과 아무 관계가 없는데도 큐브맵을 다시 그린다.
3. three `CubeCamera.update()`는 6면을 그리려고 `renderer.render`를 6번 부른다 → `RT 256x256` 패스 6개. 이 렌더는 R3F 루프 밖(React 커밋 시점)에서 일어난다.
4. `CubeCamera.update()` 마지막에 `texture.needsPMREMUpdate = true`가 설정된다. 다음 메인 렌더에서 `MeshStandardMaterial`이 이 환경맵을 쓸 때 three가 **PMREM을 다시 생성**한다(`WebGLCubeUVMaps.js`, `PMREMGenerator.js`의 여러 렌더 패스). 이 작업은 `screen` 패스 안에서 일어난다.

**powermetrics 실측** (60fps, 전원 연결)

| | 평소 | intensity 조절 중 |
|---|---|---|
| GPU 활성 비율 | 86.3% | 90.1% |
| 평균 클럭 | 1159MHz (여러 단계를 오감) | **1394MHz (최고 클럭에 고정, P8 100%)** |
| 상대 작업량 (활성 비율 × 클럭) | ≈ 1000 | ≈ 1256 (**약 +25%**) |
| 프레임당 실제 GPU 시간 | ≈ 14.4ms | ≈ 15.0ms |
| GPU 전력 | 5.55W | **7.94W (+43%)** |

**해석**
- **60fps가 유지된 이유**: GPU가 클럭을 최고로 올려 늘어난 작업(약 25%)을 흡수했다. 실제 바쁜 시간은 프레임당 약 15ms로 16.7ms 안에 들어왔다. 타이머의 30ms 이상은 8장의 부풀림이다.
- **진짜 비용은 전력과 발열**: 클럭을 올리면 전압도 올라가서, 작업량은 25% 늘었는데 전력은 43% 늘었다. 최고 클럭에서 90%를 쓰고 있어 여유가 거의 없다. 이 상태가 오래가면 발열로 클럭이 내려가 FPS가 떨어질 수 있고, 성능이 낮은 기기에서는 바로 프레임이 밀린다.
- (클럭과 처리량이 정비례한다는 가정의 대략적인 계산이고, 시스템 전체 값이다.)

**해결책**: `Environment` 부분을 intensity를 구독하지 않는 별도 컴포넌트로 분리하거나, `useMemo`나 `React.memo`로 children을 고정한다. 그러면 큐브 재렌더와 PMREM 재생성이 아예 일어나지 않는다.

---

## 10. 실제 GPU 비용 측정: powermetrics & Instruments

### powermetrics (터미널, 시스템 전체)

```bash
sudo powermetrics --samplers gpu_power -i 1000            # 1초마다 출력
sudo powermetrics --samplers gpu_power,cpu_power,thermal -i 1000 -n 30 > pageA.txt
grep "GPU Power" pageA.txt | awk '{s+=$3; n++} END {print s/n " mW"}'
```

| 항목 | 의미 |
|---|---|
| `GPU HW active residency` | 샘플 구간 중 GPU가 일한 시간의 비율. 괄호 안은 그 시간을 클럭별로 나눈 것(합 ≈ 활성 비율) |
| `GPU HW active frequency` | 일하는 동안의 평균 클럭(위 분포의 가중평균) |
| `GPU SW requested state` P1~P8 | 드라이버와 OS가 요청한 성능 단계의 비율. P1이 가장 낮고 P8이 가장 높으며, 클럭 목록 순서와 대응하는 것으로 보인다 |
| `GPU SW state` SW_P1~P8 | 소프트웨어가 GPU 상태를 강제로 제한한 기록으로 보인다. 모두 0%면 제한 없음. **공식 문서가 없어 의미 미확인.** 열 제한은 `pmset -g therm`, `--samplers thermal`로 확인 |
| `GPU idle residency` | 쉰 시간(= 100% − 활성 비율) |
| `GPU Power` | 평균 GPU 전력 |

**정정: 활성 비율은 부하 지표가 아니다.** macOS는 GPU에 일이 적으면 클럭을 낮춰 천천히 오래 일하게 한다(전력 효율이 가장 좋기 때문). 그래서 활성 비율은 부하와 상관없이 80~90%대로 맞춰지는 경향이 있다. 실제 부하는 다음으로 판단한다.
- **평균 클럭과 P-state 분포**
- **GPU 전력**
- **프레임당 에너지(mJ/frame)** (11장)

### Instruments Metal System Trace (가장 정확)

```bash
xcrun xctrace record --template 'Metal System Trace' --all-processes \
  --time-limit 10s --output ~/Desktop/chrome-gpu.trace
open ~/Desktop/chrome-gpu.trace
```

- Chrome은 보안 설정(서명) 때문에 프로세스에 직접 붙이면 안 될 수 있어서, `--all-processes`로 녹화하는 게 확실하다.
- **GPU 트랙**을 펼치면 Vertex / Fragment / Compute 채널별 막대가 나온다. 막대 구간이 GPU가 실제로 일한 시간이다.
- 막대를 선택하면 프로세스가 나온다. `Google Chrome Helper (GPU)`를 Chrome 작업 관리자(`Shift+Esc`)의 GPU 프로세스 PID와 맞춰본다.
- 16.7ms 단위로 확대하거나, 범위를 드래그해 합계를 프레임 수로 나누면 프레임당 GPU 시간이다.

---

## 11. 다른 웹페이지와 성능 비교 방법론

### 11.1 조건 맞추기 (오차의 대부분이 여기서 나온다)

| 항목 | 할 일 | 맞추지 않으면 생기는 문제 |
|---|---|---|
| 전원 | 전원 연결, Chrome 에너지 절약 모드 끄기, macOS 저전력 모드 끄기 | 30fps 제한, 클럭 제한 |
| 주사율 | 같은 모니터. ProMotion이면 60Hz로 고정 | 120fps와 60fps는 작업량이 2배 차이 |
| 캔버스 해상도 | 같은 창 크기, 확대 100%, 같은 모니터(DPR) | 픽셀 수만큼 GPU 작업량이 달라짐 |
| 브라우저 상태 | 확장 없는 게스트 프로필, 측정 탭 하나, 영상 앱 종료 | 다른 GPU 사용이 시스템 전체 값에 섞임 |
| 발열 | 2~3분 워밍업, 페이지 사이 1~2분 식히기 | 측정 순서에 따라 유불리가 생김 |
| 장면 상태 | "가만히 있을 때"와 "같은 조작"을 따로 측정 | 카메라와 애니메이션 상태에 따라 부하가 달라짐 |

> **가장 놓치기 쉬운 함정**: three.js 예제 상당수는 **화면이 바뀔 때만 렌더링**한다(on-demand, R3F `frameloop="demand"`). 그런 페이지는 가만히 있을 때 GPU를 거의 안 쓴다. 이 프로젝트는 비 애니메이션 때문에 매 프레임 그린다. 스니펫의 `drawn frames` 비율로 반드시 확인한다.

### 11.2 같은 단위로 환산하기

| 지표 | 계산 | 용도 |
|---|---|---|
| **mJ/frame** | GPU 전력(mW) ÷ 실제 그린 FPS | 한 프레임 비용. 가장 공정한 지표 |
| **mJ/frame/MP** | mJ/frame ÷ 캔버스 메가픽셀 | 캔버스 크기가 다른 페이지끼리 비교 |
| 상대 작업량 | 활성 비율 × 평균 클럭 ÷ FPS | 전력과 교차 검증 |
| CPU 전력 | `cpu_power` 샘플러 | JS 쪽이 무거운 페이지 구분 |

**예시**(둘 다 60fps 가정, 캔버스 크기와 매 프레임 렌더 여부는 미확인)

| | GPU 전력 | 평균 클럭 | mJ/frame |
|---|---|---|---|
| 현재 페이지 (평소) | 5550mW | 1159MHz | ≈ 92.5 |
| 목표 예제 | 2254mW | 677MHz | ≈ 37.6 |

→ 약 2.5배 차이. 하지만 위 조건을 확인하기 전까지는 확정할 수 없다.

### 11.3 도구

1. **powermetrics**: 전력과 클럭(10장). 빈 탭(`about:blank`) 상태의 **기준선을 빼서** 페이지의 순수 비용에 가깝게 만든다.
2. **콘솔 스니펫 `scripts/webgl-perf-snippet.js`**: 어떤 WebGL 페이지에서든 FPS, 간격 median/p95, 실제 그린 프레임 비율, 프레임당 드로우콜·정점, 캔버스 해상도·DPR·GPU 이름을 5초마다 출력한다.
   - 사용법: DevTools → Sources → Snippets에 등록해 실행하거나 콘솔에 붙여넣는다. 중지는 `window.__perfStop()`.
   - threejs.org 예제는 iframe 안에서 실행된다. 예제 URL(`threejs.org/examples/webgl_xxx.html`)을 직접 열거나, 콘솔 컨텍스트를 iframe으로 바꾼다.
   - GPU 시간은 재지 않는다(8장의 부풀림 때문). `ANGLE_instanced_arrays`, `WEBGL_multi_draw` 호출은 세지 않는다.
3. **Spector.js**(Chrome 확장): 한 프레임의 드로우콜, 셰이더, 텍스처, 렌더 타깃을 캡처한다. 두 페이지의 **구조 차이**(패스 수, 후처리, 셰이더 길이, 그림자맵 해상도)를 비교하는 데 쓴다.
4. **Instruments Metal System Trace**: Chrome GPU 프로세스의 실제 GPU 시간(10장).
5. **DevTools Performance**: 메인 스레드의 JS 시간, GC, 밀린 프레임. CPU 쪽 차이를 확인한다.

### 11.4 측정 절차

1. 조건을 맞추고, 빈 탭에서 powermetrics 기준선을 30초 측정한다.
2. 페이지 A: 2분 워밍업 → 스니펫 실행 → 가만히 30초 → 같은 조작을 하며 30초.
3. 1~2분 식힌다.
4. 페이지 B: 2와 동일하게 측정한다.
5. A → B → A → B 순서로 3회 반복하고 **중앙값**을 쓴다.

**기록표**

| | 페이지 A | 페이지 B |
|---|---|---|
| 그린 프레임 비율 / FPS / 간격 p95 | | |
| 캔버스 해상도(MP) / DPR | | |
| GPU 전력 (기준선 뺀 값) | | |
| 평균 클럭 | | |
| **mJ/frame** | | |
| **mJ/frame/MP** | | |
| 드로우콜 / 정점 (프레임당) | | |
| CPU 전력 | | |

### 11.5 원인 분리 실험

| 실험 | 해석 |
|---|---|
| 창 크기 절반 또는 dpr 1.5 → 1 | 전력이 픽셀 수에 비례해 줄면 **프래그먼트(픽셀 처리) 병목**. 셰이더, 조명, 오버드로우, 후처리를 줄인다 |
| 창 크기를 줄여도 거의 그대로 | **정점 또는 드로우콜 병목**. 지오메트리, 인스턴싱, 오브젝트 수를 본다 |
| 특정 요소 끄기 (비, `rectAreaLight`, 그림자, Environment) | 줄어든 mJ/frame이 그 요소의 비용 |
| 스니펫의 calls·verts를 예제와 비교 | 장면 복잡도 차이가 원인인지 확인 |

다른 예제의 수치는 장면 자체가 다르기 때문에 그대로 목표가 되기 어렵다. **같은 해상도와 FPS에서 mJ/frame/MP로 환산한 뒤, 어떤 요소가 차이를 만드는지 파악하는 것**을 목표로 둔다.

---

## 12. GpuTimer 로드맵

### P0: 정확도
1. **루프 밖 렌더를 다음 프레임에 합산 + `gl.info` 버그 수정**. `outOfLoopRenders` 카운터를 노출한다.
2. **프레임 단위 쿼리 모드(`mode: "frame"`)**: 프레임 전체를 쿼리 1개로 측정한다. ANGLE Metal의 커맨드 버퍼 flush가 줄어 부풀림과 측정 부담이 감소한다. 패스별 분석은 `"pass"` 모드로 한다.
3. **환경 인식 + 신뢰도 표시**: ANGLE Metal을 감지하고, 패스가 많거나 "GPU avg > 프레임 간격인데 간격이 안정적"이면 과대 추정 의심을 표시한다.
4. **측정 부담 측정**: 타이머를 켠 상태와 끈 상태의 FRAME·CPU를 비교한다.

### P1: 지표 확장
5. 실제 그린 프레임 비율, 캔버스 해상도·DPR·MP, 픽셀당 정규화
6. 끊김 지표: 예산의 1.5배를 넘은 프레임 수, 간격 히스토그램
7. 원인 추적: 큐브 RT 라벨, PMREM 재생성 횟수, 셰이더 컴파일 횟수, 루프 밖 렌더 발생 표시
8. 텍스처·지오메트리 GPU 메모리 추정(MB)

### P2: 비교·실험 도구
9. 세션 기록과 JSON/CSV 내보내기(환경 메타데이터, powermetrics와 맞출 타임스탬프 포함)
10. 재현 가능한 카메라 경로 시나리오
11. 실험 토글 패널(비 / `rectAreaLight` / Environment / dpr)
12. 구조 분리: 수집기(core) / 오버레이 / `useFrameStats` 훅, dev 전용 로딩

---

## 출처

- [Chromium battery_saver_mode_manager.cc](https://github.com/chromium/chromium/blob/main/chrome/browser/performance_manager/user_tuning/battery_saver_mode_manager.cc)
- [Chromium issue 40158973: Investigate reducing frame rate to reduce power consumption](https://issues.chromium.org/issues/40158973)
- [Chrome Developers: Memory and Energy Saver modes](https://developer.chrome.com/blog/memory-and-energy-saver-mode)
- [Google Chrome Help: Performance settings](https://support.google.com/chrome/answer/12929150)
- [Chrome Enterprise: BatterySaverModeAvailability](https://chromeenterprise.google/intl/en_ca/policies/battery-saver-mode-availability/)
- [motion.dev: When browsers throttle requestAnimationFrame](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe)
- [Chrome Developers: DevTools customization (GPU track)](https://developer.chrome.com/blog/devtools-customization)
- [Chromium gpu_tracer.cc](https://chromium.googlesource.com/codesearch/chromium/src/+/HEAD/gpu/command_buffer/service/gpu_tracer.cc)
- [W3C public-webapps: refresh rate API discussion (2017)](https://lists.w3.org/Archives/Public/public-webapps-github/2017Nov/0901.html)
- [WICG proposals #165](https://github.com/WICG/proposals/issues/165)
- [web-features: Battery status](https://web-platform-dx.github.io/web-features-explorer/features/battery)
- [GitHub gist: rAF-based battery saver heuristic](https://gist.github.com/fuweichin/f7b675c7a5bab86dd1488962e646c6cc)
- [Chrome for Developers: Compute Pressure API](https://developer.chrome.com/docs/web-platform/compute-pressure)
- [ANGLE mtl_command_buffer.mm](https://github.com/google/angle/blob/main/src/libANGLE/renderer/metal/mtl_command_buffer.mm)
- [ANGLE QueryMtl.mm](https://github.com/google/angle/blob/main/src/libANGLE/renderer/metal/QueryMtl.mm)
- [MDN: Performance.measureUserAgentSpecificMemory()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory)
