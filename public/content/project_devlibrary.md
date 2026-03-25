# Dev library

## 프로젝트 개요

- 📌 &nbsp; 프로젝트명: Dev library
- 🧑🏻‍💻 &nbsp; 팀원: 1명
- 🗓️ &nbsp; 기간: 2026.1.1 ~ 2026.3.4
- 🍀 &nbsp; github: <a href="https://github.com/ka1dyn/ka1dyn-log" target="_blank" rel="noopener noreferrer">github repo</a>
- ✈️ &nbsp; service url: <a href="https://blog.ka1dyn.com" target="_blank" rel="noopener noreferrer">dev library</a>
- ✅ &nbsp; 맡은 역할: 기획, 디자인, 프론트엔드 개발, 배포

## 프로젝트 배경

블로그를 편하게 쓰는 방법이 없을까 고민하던 중 직접 개발해서 글 쓰는 모든 과정을 자동화하하기 위해 시작한 프로젝트이다. 로컬에서 노트 앱인 Obsidian으로 글을 작성하면, 특별히 관리하지 않아도 자동으로 웹 페이지가 생성된다. 

핵심 아이디어
- 공부할 때 작성하는 내용과 출판 글을 분리해서 관리
- 콘텐츠는 외부에서 private하게 보호, 내용 수정 시 배포 자동화

## 기술스택
<div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; min-height: 40px;">
  <img
    src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white"
    alt="Next.js Badge"
    style="display: block; height: 40px; margin: 0;"
  />
  <img
    src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"
    alt="TypeScript Badge"
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
  <img src="https://img.shields.io/badge/Github_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" style="display: block; height: 40px; margin: 0;" />
  <img
    src="https://img.shields.io/badge/Obsidian-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white"
    alt="Obsidian Badge"
    style="display: block; height: 40px; margin: 0;"
  />
</div>

- Next.js
- Typescript
- Tailwindcss
- Zustand
- Github action
- Obsidian

## 핵심 기술 설명
---

### 📌 콘텐츠 보호를 위한 구조 설계 및 배포 자동화

![alt text](/content/images/devlibrary_structure.png)

- public으로 배포한 프로젝트 repo에 콘텐츠가 포함되지 않도록 private 저장소에 따로 보관
- 프로젝트 내에 통합하기 위해 git submodule 도입
- git의 URL alias를 활용한 vercel private submodule 인증문제 해결
- 셸 스크립트를 통한 콘텐츠 자동 update 추가
- github action과 vercel webhook을 기반으로 한 배포 자동화

관련 블로그 글
- <a href="https://www.blog.ka1dyn.com/blog/Projects/Dev-library/git%20submodule%EC%9D%84%20%ED%99%9C%EC%9A%A9%ED%95%9C%20%EC%BD%98%ED%85%90%EC%B8%A0%20%EB%B6%84%EB%A6%AC" target="_blank" rel="noopener noreferrer">Submodule 도입 과정 정리</a>
- <a href="https://www.blog.ka1dyn.com/blog/Projects/Dev-library/vercel%20private%20submodule%20%EB%B0%B0%ED%8F%AC%20%EC%8B%9C%20%EC%9D%B8%EC%A6%9D%EB%AC%B8%EC%A0%9C%20%ED%95%B4%EA%B2%B0%EB%B0%A9%EB%B2%95" target="_blank" rel="noopener noreferrer">vercel의 private submodule 배포 시 인증문제 해결과정</a>

### 📌 마크다운 렌더링 파이프라인 구축

페이지 렌더링 흐름
1. obsidian의 플러그인을 활용한 frontmatter 템플릿 자동생성 및 글 작성
2. obsidian git 플러그인을 사용한 auto push
3. prebuild 스크립트를 통한 데이터 준비
    - content repo 최신화, 배포환경에서는 인증 및 clone
    - 이미지 폴더 복사
    - 마크다운 파싱 및 JSON 기반 캐싱, 썸네일 경로 자동 삽입
4. Next.js의 SSG를 활용한 정적 페이지 생성
5. 태그 가로채기를 통한 마크다운 내 이미지 경로 수정
6. 트리 자료구조를 통한 side nav 자동 생성

관련 블로그 글

<a href="https://www.blog.ka1dyn.com/blog/Projects/Dev-library/Next.js%EC%9D%98%20SSG%EB%A5%BC%20%ED%99%9C%EC%9A%A9%ED%95%9C%20%EB%A7%88%ED%81%AC%EB%8B%A4%EC%9A%B4%20%ED%8E%98%EC%9D%B4%EC%A7%80%20%EB%A0%8C%EB%8D%94%EB%A7%81%20%EC%9E%90%EB%8F%99%ED%99%94" target="_blank" rel="noopener noreferrer">Next.js의 SSG를 활용한 마크다운 페이지 렌더링</a>


### 📌 모바일 사용자의 UX를 위한 다양한 반응형 전략

- tailwindcss breakpoint의 폭넓은 사용
- 커스텀 media query 훅을 사용한 코드 재사용
- 반응형 페이지 인디케이터 UI 구현

## 핵심 UI 설명

1. Hero page
    <img src="/content/images/library_heropage.gif" style="width:100%;">

    적용한 애니메이션
    - 마우스 트래킹, glow 애니메이션
    - 타이핑 애니메이션
    - 버튼 마운트 애니메이션

2. Side Nav
    <img src="/content/images/library_nav.gif" style="width:100%;">

    - 모바일 화면 overlay 추가
    - 폴더 트리 구조 ui
    - 펼치기 / 접기 기능
    - 버튼 hover 애니메이션

3. Posts Page
    <img src="/content/images/library_posts.gif" style="width:100%;">

    - 카드 마운트 애니메이션
    - URL기반 모음집, 카테고리 필터링
    - 페이지 인디케이터 UI

4. Content Page
    <img src="/content/images/library_toc.gif" style="width:100%;">

    - 태그 기반 목차, Side TOC 자동생성
    - 스크롤 위치 기반 목차 하이라이트 적용
    - 클릭 시 section 스크롤 이동

## 느낀점

배포 환경에서 환경변수를 관리할 때 항상 github나 vercel에 변수를 등록해서
사용했었는데, 이번 기회에 private repository로 쉽게 관리하는 방법도 알게 되어 좋았다.

성급히 데스크탑 기반 UI를 만들고 추후 모바일을 대응하려니 수정이 어려웠다. 역시
모바일 화면을 시작으로, 점차 스크린 사이즈를 키워가며 디자인 및 구현하는 방식이 좋다고 느꼈다.
