# network_master

![Node.js](https://img.shields.io/badge/Node.js-24.14.0-5FA04E?logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-11.9.0-CB3837?logo=npm&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14.2-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google&logoColor=white)
![Amazon S3](https://img.shields.io/badge/Amazon_S3-Static_Hosting-569A31?logo=amazons3&logoColor=white)
![Amazon CloudFront](https://img.shields.io/badge/Amazon_CloudFront-CDN-FF9900?logo=amazoncloudfront&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.6.2-F7B93E?logo=prettier&logoColor=1A2B34)

- 네트워크관리사 2급 기출문제를 랜덤 문제 풀이 형태로 연습할 수 있는 학습용 웹앱입니다.
- 과목별로 문제를 골라 풀고, 틀린 문제나 메모한 문제만 다시 모아서 복습할 수 있습니다.
- 풀이 기록과 메모는 브라우저에 저장되며, 필요하면 JSON으로 내보내거나 가져올 수 있습니다.

![메인페이지](/main_page.png)

[이용해보기](https://d2zvo1w2qzgotf.cloudfront.net/)

## 주요 기능

- 과목별 문제 풀이
- `전체 문제 / 틀린 문제만 / 메모 있는 문제만` 출제 필터
- `미풀이 문제 우선 보기`와 `진행상황 보기`
- 문제별 풀이 기록 저장
- 정답 공개 후 문제 `AI 해설 보기`
- 정답 공개 후 선택지별 `AI 해설 보기`
- 선택지별 메모 작성
- 해설 노트에서 메모 모아 보기
- 해설 노트 검색
- 기록 JSON 내보내기 / 가져오기

## 이용 방법

### 1. 과목 선택

왼쪽 설정바에서 과목을 선택하면 해당 과목 문제만 볼 수 있습니다.

- 전체
- TCP/IP
- 네트워크일반
- NOS
- 네트워크운용기기

### 2. 문제 풀이

선택지를 고른 뒤 `정답 확인`을 누르면 결과가 표시됩니다.  
선택지를 고른 상태에서는 `Enter` 키로도 정답 확인이 가능합니다.

정답 공개 후에는 문제 본문의 `AI 해설 보기` 버튼으로 정답 해설을, 각 선택지의 `AI 해설 보기` 버튼으로 선지별 해설을 따로 확인할 수 있습니다.

정답 확인 후 `Tab` 키를 누르면 다음 문제 이동 확인 팝업이 열립니다.

- `확인` 또는 `Enter`: 다음 문제 이동
- `취소` 또는 `Esc`: 현재 문제 유지

### 3. 출제 범위 선택

문제 범위 카드에서 아래 세 가지 모드 중 하나를 선택할 수 있습니다.

- 전체 문제
- 틀린 문제만
- 메모 있는 문제만

### 4. 학습 옵션

설정바 학습 옵션에서 아래 기능을 켜고 끌 수 있습니다.

- `미풀이 문제 우선 보기`
- `진행상황 보기`

### 5. 선지 메모 작성

각 선택지 오른쪽의 `메모 쓰기` 또는 `메모 보기` 버튼을 눌러 메모를 열 수 있습니다.  
헷갈리는 포인트나 직접 정리한 내용을 남겨두고 나중에 다시 확인할 수 있습니다.

### 6. 해설 노트 보기

상단의 `해설 노트` 탭으로 이동하면 메모가 있는 문제만 따로 모아서 볼 수 있습니다.

- 같은 문제에 메모가 여러 개 있으면 한 카드에 묶어서 표시
- `메모 있는 문제만 다시 풀기` 버튼으로 바로 복습 가능
- 문제 본문, 선택지, 메모 내용 검색 가능
- `5개 / 10개 / 20개씩 보기` 지원

### 7. 기록 저장 방식

풀이 기록과 메모는 브라우저 `localStorage`에 저장됩니다.

- 같은 브라우저에서는 새로고침 후에도 유지됩니다.
- 다른 기기로 옮기려면 `기록 도구`에서 JSON을 내보내고 가져오면 됩니다.

### 8. 기록 내보내기 / 가져오기

하단 `기록 도구`에서 현재 기록을 JSON으로 복사하거나 다른 기록을 가져올 수 있습니다.

- `전체 복사`: 현재 기록을 클립보드에 복사
- `기록 적용하기`: 가져온 JSON을 기존 기록과 병합

개발 관련 내용은 [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md)에 정리합니다.
