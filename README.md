# network_master

![Node.js](https://img.shields.io/badge/Node.js-24.14.0-5FA04E?logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-11.9.0-CB3837?logo=npm&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-29.2.0-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14.2-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.0-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.6.2-F7B93E?logo=prettier&logoColor=1A2B34)

네트워크관리사 2급 기출문제를 PDF 대신 문제집 앱처럼 풀 수 있게 만든 학습용 웹앱입니다.  
기출 PDF에서 문제를 추출해 랜덤으로 한 문제씩 풀 수 있고, 풀이 기록과 선택지별 메모도 저장할 수 있습니다.

## 주요 기능

- 회차 구분 없이 랜덤으로 1문제씩 풀이
- 과목별 필터 선택
- 정답 확인 및 누적 풀이 기록 저장
- 선택지별 해설 메모 저장
- 내 기록 JSON 내보내기 / 가져오기
- Docker 또는 로컬 환경에서 실행 가능

## 실행 전 준비

다음 둘 중 한 가지 방식으로 실행할 수 있습니다.

### 1. Docker로 실행 (권장)

필요한 것:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 또는 Docker Engine
- `docker compose`

설치 확인 명령:

```bash
docker --version
docker compose version
```

### 2. 로컬에서 실행

필요한 것:

- Node.js
- npm

설치 확인 명령:

```bash
node -v
npm -v
```

---

## QUICK START

### Docker로 실행 (권장)

```bash
docker compose up --build
```

브라우저에서 아래 주소로 접속합니다.

> <http://localhost:4173>

이미 빌드된 상태에서 다시 실행만 할 때는 아래 명령을 사용하면 됩니다.

```bash
docker compose up
```

### 로컬에서 실행

```bash
# 최초 or 코드 변경시
npm install

# 앱 실행 명령어(개발환경)
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

> <http://localhost:5173>

---

## 사용 방법

### 1. 과목 선택

왼쪽의 과목 필터에서 원하는 범위를 선택할 수 있습니다.

- 전체
- TCP/IP
- 네트워크일반
- NOS
- 네트워크운용기기

### 2. 문제 풀기

선택지 4개 중 하나를 고른 뒤 `정답 확인` 버튼을 누르면 채점됩니다.  
선택지를 고른 상태에서는 `Enter` 키로도 정답 확인이 가능합니다.

### 3. 풀이 기록 보기

각 문제마다 아래 정보가 저장됩니다.

- 몇 번째 푸는 문제인지
- 마지막 선택 결과
- 맞은 횟수
- 틀린 횟수

### 4. 선택지 메모 저장

각 선택지 오른쪽의 아이콘을 눌러 메모 영역을 열 수 있습니다.  
헷갈리는 포인트나 해설을 적어두면 다음에 다시 볼 수 있습니다.

### 5. 기록 내보내기 / 가져오기

하단의 `기록 도구`를 열면 내 기록을 JSON으로 복사하거나, 다른 PC에서 가져올 수 있습니다.  
여러 기기 자동 동기화는 아니지만, 수동으로 기록을 옮길 수 있습니다.

## 현재 포함된 데이터

- 수록 회차: 2022년~2025년
- 총 PDF: 16개
- 총 문항 수: 800문항

## 데이터 저장 방식

풀이 기록과 메모는 현재 브라우저의 `localStorage`에 저장됩니다.

**주의:**

- 브라우저 데이터를 삭제하면 기록도 사라집니다.
- 다른 PC나 다른 브라우저에는 자동으로 동기화되지 않습니다.
- 다른 환경으로 옮기려면 `기록 내보내기 / 가져오기` 기능을 사용해야 합니다.

## 개발자용 문서

빌드 과정, PDF → JSON 생성 흐름, Docker 데이터 생성 컨테이너, 주요 파일 구조는 아래 문서로 분리했습니다.

- [개발자 가이드](/docs/DEVELOPER_GUIDE.md)
