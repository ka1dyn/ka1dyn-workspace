# Ka1dyn workspace

## 프로젝트 개요

- 📌 &nbsp; 프로젝트명: Ka1dyn workspace
- 🗓️ &nbsp; 기간: 2025.12.05 ~ 2026.2.24
- ✈️ &nbsp; service url: <a href="https://workspace.ka1dyn.com" target="_blank" rel="noopener noreferrer">ka1dyn-workspace</a>

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


## UI

1. Loading Page

![loading](https://github.com/user-attachments/assets/b8ce6277-5287-4117-b26d-463f4f369fe4)

2. Canvas Scene

![zoom](https://github.com/user-attachments/assets/da31af27-cad2-48cc-a01f-fbd2936217a9)

4. Overlay

![workspace_overlay](https://github.com/user-attachments/assets/4d44f1a5-2fd5-4de6-96af-a070bc583bc9)

![overlay-2](https://github.com/user-attachments/assets/1206d1f5-2363-44a9-a7a4-0d62350b005d)

4. Screen Page

![dock](https://github.com/user-attachments/assets/795d9d7a-dfad-4ac3-93df-ccb01c9266a8)

![modal](https://github.com/user-attachments/assets/1bca6609-7bde-43dc-8b3a-7f0a79615bf5)

![dive](https://github.com/user-attachments/assets/367cf9f6-704c-43f7-9732-d99b7f2b9b66)

