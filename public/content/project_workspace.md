# Ka1dyn-workspace

## 프로젝트 개요

- 📌 &nbsp; 프로젝트명: Ka1dyn-workspace
- 🧑🏻‍💻 &nbsp; 팀원: 1명
- 🗓️ &nbsp; 기간: 2025.12.05 ~ 2026.2.24
- 🍀 &nbsp; github: https://github.com/ka1dyn/ka1dyn-workspace
- ✈️ &nbsp; service url: https://test.com
- ✅ &nbsp; 맡은 역할: 기획, 디자인, 프론트엔드 개발, 배포

## 프로젝트 배경

> 좀 더 재미있게 포트폴리오를 보여줄 수 있는 방법이 없을까?

웹사이트의 목적은 여러 가지가 있겠지만, 사람들의 기억에 오래 남도록 하는 방법 중 하나는
신기하고 재밌는 경험을 선사하는 것이다. 3d 인터랙티브 웹은 사용자로 하여금
다양한 상호작용을 통해 몰입감 있는 웹 서핑을 즐길 수 있도록 한다.
이는 추후 다양한 마케팅이나 효과적인 정보 전달에도 사용할 수 있다고 생각하여, 개발 경험을 쌓고자 
포트폴리오를 3d 기반으로 제작하게 되었다.

## 기술스택
<div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; min-height: 40px;">
  <img
    src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"
    style="display: block; height: 40px; margin: 0;"
  />
  <img
    src="https://img.shields.io/badge/React_Three_Fiber-000000?style=for-the-badge&logo=three.js&logoColor=white"
    alt="R3F Badge"
    style="display: block; height: 40px; margin: 0;"
  />
  <img
    src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white"
    alt="Tailwind CSS Badge"
    style="display: block; height: 40px; margin: 0;"
  />
  <img
    src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=61DAFB"
    alt="Zustand Badge"
    style="display: block; height: 40px; margin: 0;"
  />
  <img
    src="https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black"
    alt="GSAP Badge"
    style="display: block; height: 40px; margin: 0;"
  />
</div>

- React, React three fiber 
- Typescript
- Tailwindcss
- Zustand
- Gsap

단일 페이지(Single Page) 기반의 UI 기능이 핵심인 프로젝트 특성을 고려하여 React를 개발 프레임워크로 채택했다. 또한, React 생태계와 높은 호환성을 가진 React Three Fiber(R3F)를 활용하여, 순수 Three.js 대비 효율적인 방식으로 3D Scene을 구축했다.

## 핵심 기술 설명

- FPS 최적화
    - FPS를 최적화하기 위해 현재 노트북 환경에서 GPU time per Frame을 측정했다. 한 프레임을
      그리는데 걸리는 시간을 10ms 내외로 목표를 잡았고, 기존 25~30ms가 걸리던 작업을 목표치에 맞출 수 있었다. 최적화 전략은 다음과 같다.
    - 3d Model의 vertex, triangle 수 줄이기
    - drawcall 줄이기
    - 텍스처 아틀라스 및 압축
    - DPR(Device Pixel Ratio) 조절을 통한 해상도 낮추기
    - useFrame 로직 최대한 줄이기
    - 그림자 해상도 조절
    - Screen raycasting을 occlude 방식으로 수정
- 폰트 및 이미지 Preloading
    - 개발 환경에서는 괜찮았지만, 배포 이후 네트워크 차이로 인한 프레임 드랍과 이미지 로딩 지연 문제가 있어서 여러 preload 방식을 도입했다.
    - link 태그를 활용한 폰트 preload 추가
    - 커스텀 훅을 사용한 동적 이미지 preload 구현
    - canvas 최초 1회 텍스처 즉시렌더링을 통한 model, texture preloading
- 컴포넌트 언마운트 시 Zustand 상태 백업 로직 구현
    - 맥북 스크린을 전체화면으로 바꿀 때, 모달창의 html구조가 파괴 되고 재생성되기 때문에 상태가 유지되지 않는다. 그렇다고 모든 상태를 실시간으로 zustand와 동기화하면 렌더링 비용이 발생하기 때문에,
    개별 컴포넌트 상태를 전부 일괄 백업하고 복구하는 로직을 추가했다.
    - 개발 과정 중 zustand devtools 미들웨어를 도입하여 상태 변화를 관찰
    - 외부 Transform 변화에 대응하기 위한 local offset 연산 및 저장
- 벡터 연산을 활용한 카메라 이동, 특수효과 구현
- 다양한 애니메이션 구현
    - Web animation API를 활용한 Audio Visualizer, 모달창 open close 애니메이션
    - UseLayoutEffect 훅 내부에서 offset 계산을 통한 dock indicator 애니메이션
    - css keyframe을 활용한 버튼 hover 애니메이션
- css 역스케일링을 활용한 스크린 텍스트 해상도 개선


## UI 설명

1. Loading Page
<img src="/content/images/loading.gif" style="width:100%;">
이미지, 3d model을 로드하는 동안 사용자 경험을 해치지 않기 위해 추가한 UI이다.
텍스트 애니메이션이 끝나도 로드가 끝나지 않았다면 `Loading...` 메시지가 출력되며,
로드가 완료되면 start버튼이 나온다. 시작 버튼을 누르면 Scene이 보이면서 시작 애니메이션 실행된다.

2. Canvas Scene
   <img src="/content/images/zoom.gif" style="width:100%;">
   
   마우스로 카메라 위치와 회전을 조절할 수 있다. 클릭 및 이동 시 회전이 가능하고,
   스크롤을 통해 줌인, 줌아웃이 가능하다. 구성 요소들은 다음과 같다.
   
   - 3d models
   - 떨어지는 빗방울, 비에 젖은 노면
   - 구름 배경
   - 번개 효과
   - 맥북 스크린
   - 배경음, 환경음

3. Overlay
    <img src="/content/images/overlay-1.gif" style="width:100%;">
    왼쪽 상단에 시각효과와 사운드 옵션을 수정할 수 있는 버튼을 추가했다.
    빛의 색과 강도를 바꿀 수 있으며, 음량을 조절할 수 있다.


    <img src="/content/images/overlay-2.gif" style="width:100%;">
    오른쪽 상단에 audio visualizer, github link, 전체화면 버튼을 추가했다.
    audio visualizer 클릭을 통해 음소거할 수 있다.

4. Screen Page
    <img src="/content/images/dock.gif" style="width:100%;">
    맥북의 ui를 참고하여 만든 스크린 디자인이다. 하단 Dock을 통해 배경화면 변경, 폴더 내리기 등의 액션을 수행할 수 있다. <br>

    <img src="/content/images/modal.gif" style="width:100%;">
    폴더를 더블클릭할 경우 각 폴더에 맞는 내용의 modal이 열린다. modal은 움직이고 리사이징이 가능하도록 만들었으며, 해상도에 맞게 자동으로 반응한다.

    <img src="/content/images/dive.gif" style="width:100%;">
    screen dive 버튼을 누르면 맥북 스크린이 전체화면으로 채워지고, 우측 상단 exit 버튼을 누르면 다시 3d scene으로 돌아온다.

## 느낀점

웹사이트 성능에 대해 많은 고민을 해보는 시간이었다. 어떤 성능을 측정해야하는지, 평가 기준은 무엇인지 등 신경써야 할 부분들이 많았다. 또한 병목이 되는 부분을 찾기 위해 브라우저 기능을 정말 잘 활용할 수 있어야 함을 느꼈다.