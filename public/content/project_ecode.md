# Ecode

## 프로젝트 개요

- 📌 &nbsp; 프로젝트명: Ecode
- 🧑🏻‍💻 &nbsp; 팀원: 6명
- 🗓️ &nbsp; 기간: 2023.9.17 ~ 2023.12.21
- 🍀 &nbsp; github: https://github.com/ka1dyn/2023fall_41class_team2
- ✈️ &nbsp; service url: https://test.com
- ✅ &nbsp; 맡은 역할: 팀장, 구조설계, 프론트엔드, 배포

## 프로젝트 구조

Sequence diagram
![](/content/images/sequence.png)

![](/content/images/backend_diagram.png)

## 프로젝트 배경

대학 과정 중 그린 코드라는 주제에 맞게 JAVA 코드를 실행시켜 탄소배출량을 계산해주는 사이트를 제작했다. 해당 사이트를 사용하여 여러 그린화 패턴을 적용한 코드를 실행한 뒤, 적용 전후 탄소배출량의 차이를 직접 확인하며 보고서를 작성했다.


## 기술스택
<div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; min-height: 40px;">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Recoil-3578E5?style=for-the-badge&logo=recoil&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/FastAPI-05998B?style=for-the-badge&logo=fastapi&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Amazon_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Amazon%20S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/CloudFront-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" style="display: block; height: 40px; margin: 0;" />

<img src="https://img.shields.io/badge/Github_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" style="display: block; height: 40px; margin: 0;" />
</div>

### Frontend
- React, React query, Framer motion, Recoil
### Backend
- FastAPI, Docker
### Deploy
- EC2, CloudFront, S3, Github Action

## 프로젝트 기여

팀원 6명 중 비전공자 인원도 있었기에, 팀장으로서 프로젝트에서 소외되는 인원이 없도록
팀원 간 소통에 집중했다.

- Technique
  - 백엔드 구조 설계, 개별 컨테이너 생성을 통한 코드 실행환경 분리 테스트
  - Github action을 활용한 프론트엔드 배포 자동화
  - Landing page 디자인 및 Framer motion을 사용한 애니메이션 구현
  - Recoil과 React query를 사용한 간단한 API 사용
  - 팀원 간 개발 환경을 맞추기 위한 백엔드 서버 도커라이징, 전 인원 로컬 테스트
- Soft skills
  - git flow 설정, issue나 pr 적극 사용
  - notion, slack 등 소통을 위한 초기 세팅

git flow 도식화
![](/content/images/gitflow.png)

<details>
  <summary>상세 git flow 확인하기</summary>

  ### 기본 룰
  - 작업하기 전 이슈 남기기
  - merge 대신 rebase 사용하기 ( pr하기 전 현재까지 개발된 내용을 rebase해서 올리기)
  - 함께 협업하는 브랜치는 PR로 관리하기, 긴급한 bug fix만 직접 push
  - PR에 대한 리뷰 하기
  - PR 머지 이후 브랜치 삭제하기
  - PR 내용은 자세히 적기

  ### Git Flow
  주요 브랜치는 다음과 같다

  - main : 최종 개발된 내용
  - hotfix/[hotfix 내용] : 최종 배포된 내용중 긴급하게 버그를 수정하는 브랜치
  - develop : main으로 올리기 전에 검증하는 브랜치
  - bug/[bugfix 내용] : develop 브랜치에서 발생한 버그를 즉시 수정하는 브랜치 (보통 release로 관리하는데 없어서…)
  - dev/frontend : frontend 개발사항 통합 브랜치
  - dev/backend : backend 개발사항 통합 브랜치
  - feature/[만들 내용] : 개별 기능 개발 브랜치
  - test/[테스트 내용]

  ### 브랜치 머지 전략

  main : 리뷰어 2명 필수, pr로 관리

  develop : 리뷰어 2명 필수, pr로 관리

  dev/frontend, backend : 리뷰어 1, pr로 관리, 버그fix인 경우에만 직접push, 기능 개발은 반드시 feature브랜치 생성하기

  feature/[만들 내용] : 리뷰어 x, 직접 push로 커밋 관리

  test/[만들 내용] : 원하는대로 기능 테스트 시 생성, 테스트 완료되면 삭제

  주의사항
  - develop → main PR은 논의로 결정, 머지되면 태그로 버전명시
  - 협업하는 브랜치에서 변경사항이 발생하면 local에도 반영 (rebase)
  - git 명령어 치는게 뭔가 애매하면 꼭 로컬에 branch backup해두기 (잘못하면 그냥 날라감)
</details>

## 핵심 UI 설명

### Landing Page
<img src="/content/images/Ecode_UI.gif" style="width:100%;">

적용한 애니메이션 종류
- border 애니메이션
- 타이핑 애니메이션
- react-animated-numbers를 활용한 숫자변동 애니메이션
- 스크롤 시 컴포넌트 view 감지를 통한 마운트 애니메이션

<img src="/content/images/calculate.gif" style="width:100%;">

- code mirror를 사용한 코드 에디터
- 코드 포맷팅 기능 제공
- calculate 버튼 및 loading indicator
- 코드 실행 결과 화면
  - 탄소배출량 결과창
  - 코드 실행결과 (std out과 err 구분)


## 느낀점

프로젝트를 진행할 때 개발 이외에 필요한 것들이 정말 많다고 느꼈다. 팀원 간 정보 공유가
얼마나 원활하게 이뤄지는가에 따라 코드 품질이나 개발 속도에도 영향을 크게 미치는 것 같다.