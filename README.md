# network_master

네트워크관리사 2급 필기 기출문제를 랜덤으로 풀어보는 React 기반 학습 앱입니다.  
프로젝트에는 추출된 기출 데이터가 포함되어 있으며, Docker 이미지로 바로 빌드해서 실행할 수 있습니다.

## 사전 준비

앱을 실행하기 전에 아래 항목이 준비되어 있어야 합니다.

### Docker로 실행할 경우

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 또는 Docker Engine
- `docker compose` 명령을 사용할 경우 Docker Compose 지원 환경

확인 명령:

```bash
docker --version
docker compose version
```

### 로컬 개발 환경으로 실행할 경우

- Node.js 22 이상 권장
- npm

확인 명령:

```bash
node -v
npm -v
```

현재 포함된 데이터 기준:

- 시험 회차: 2022년부터 2025년도까지 총 16개
- 전체 문항 수: 800개
- 과목: `TCP/IP`, `네트워크일반`, `NOS`, `네트워크운용기기`

## 구성 개요

- 프론트엔드: React + Vite + TypeScript
- 배포 방식: 정적 파일 빌드 후 Nginx로 서빙
- 문제 데이터: [`generated/exams.json`](/Users/habyungro/devRoot/network_master/generated/exams.json)
- 원본 PDF: [`docs`](/Users/habyungro/devRoot/network_master/docs) ([출처](https://www.gunsys.com/gunsystem_pilgi.htm?cbt=net2))

## Docker 이미지 빌드

프로젝트 루트에서 아래 명령으로 이미지를 빌드합니다.

```bash
docker build -t network-master .
```

빌드 과정은 다음과 같습니다.

1. `node:22-alpine` 이미지에서 앱을 빌드합니다.
2. 생성된 정적 파일을 `nginx:1.29-alpine` 이미지로 복사합니다.
3. Nginx가 80 포트로 앱을 서빙합니다.

관련 파일:

- [`Dockerfile`](/Users/habyungro/devRoot/network_master/Dockerfile)
- [`docker/nginx.conf`](/Users/habyungro/devRoot/network_master/docker/nginx.conf)

## Docker 컨테이너 실행

직접 `docker run`으로 실행하는 방법입니다.

```bash
docker run --rm -p 4173:80 network-master
```

실행 후 브라우저에서 아래 주소로 접속합니다.

> http://localhost:4173

## Docker Compose로 실행

`docker-compose.yml`이 포함되어 있으므로 아래 명령으로도 실행할 수 있습니다.

```bash
docker compose up --build
```

백그라운드 실행:

```bash
docker compose up --build -d
```

중지:

```bash
docker compose down
```

설정 파일:

- [`docker-compose.yml`](/Users/habyungro/devRoot/network_master/docker-compose.yml)

## 새 PDF 추가 후 데이터 갱신

새 PDF를 [`docs`](/Users/habyungro/devRoot/network_master/docs)에 넣은 뒤에는 먼저 [`generated/exams.json`](/Users/habyungro/devRoot/network_master/generated/exams.json)을 다시 생성해야 합니다.

이 작업은 로컬 Python 없이 Docker로 실행할 수 있습니다.

```bash
docker compose run --rm data-builder
```

이 명령은 다음을 수행합니다.

1. 데이터 생성 전용 Python 컨테이너를 실행합니다.
2. `docs` 폴더의 PDF를 읽습니다.
3. [`scripts/build_exam_json.py`](/Users/habyungro/devRoot/network_master/scripts/build_exam_json.py)를 실행합니다.
4. 결과를 [`generated/exams.json`](/Users/habyungro/devRoot/network_master/generated/exams.json)에 반영합니다.

그 다음 앱 이미지를 다시 빌드하거나 실행하면 됩니다.

```bash
docker compose up --build
```

주의:

- 앱 Docker 빌드는 PDF를 자동으로 파싱하지 않습니다.
- 새 PDF를 반영하려면 먼저 `data-builder`를 실행해야 합니다.

## 앱 사용 방법

앱에 접속하면 문제 1개가 무작위로 표시됩니다. 회차 구분 없이 전체 문제 풀에서 랜덤으로 출제됩니다.

### 1. 과목 필터 선택

왼쪽 `Subject Filter` 영역에서 원하는 과목을 선택합니다.

- `전체`: 모든 과목에서 랜덤 출제
- `TCP/IP`
- `네트워크일반`
- `NOS`
- `네트워크운용기기`

과목을 바꾸면 해당 과목 범위에서 새 문제가 다시 선택됩니다.

### 2. 문제 풀이

문제와 4개의 선택지 중 하나를 클릭해 답을 고릅니다.

- 선택지만 고른 상태에서는 아직 채점되지 않습니다.
- `정답 확인` 버튼을 누르거나 `Enter` 키를 누르면 채점됩니다.

채점 후에는 다음 정보를 확인할 수 있습니다.

- 맞았는지/틀렸는지
- 정답 번호
- 정답 선택지 텍스트

### 3. 다음 문제 보기

`다른 문제` 버튼을 누르면 현재 문제와 다른 문제가 랜덤으로 다시 선택됩니다.

### 4. 풀이 기록 확인

문제 카드 상단에는 현재 문제 기준 학습 기록이 표시됩니다.

- `누적 풀이`: 해당 문제를 몇 번 풀었는지
- `마지막 결과`: 마지막에 어떤 선택지를 골랐고 맞았는지
- `맞은 횟수`
- `틀린 횟수`

### 5. 선택지별 메모 남기기

각 선택지 오른쪽의 `❔` 아이콘을 누르면 메모 입력창이 열립니다.

여기에 아래 내용을 저장할 수 있습니다.

- 오답 포인트
- 헷갈리는 개념
- 암기할 내용
- 선택지 함정 정리

메모는 문제별, 선택지별로 저장됩니다.

### 6. 기록 내보내기 / 가져오기

화면 아래 `기록 도구` 영역을 열면 학습 기록을 백업하거나 다른 브라우저로 옮길 수 있습니다.

`내 기록 내보내기`

- 현재 풀이 기록이 JSON 형식으로 표시됩니다.
- `전체 복사` 버튼으로 한 번에 복사할 수 있습니다.

`기록 가져오기`

- 다른 환경에서 내보낸 JSON을 붙여넣습니다.
- `붙여넣은 기록 반영` 버튼을 누르면 기존 기록과 병합됩니다.

## 데이터 저장 방식

사용자 풀이 기록은 서버나 DB에 저장되지 않고, 현재 브라우저의 `localStorage`에 저장됩니다.

주의할 점:

- 브라우저 데이터를 삭제하면 기록도 사라질 수 있습니다.
- 다른 PC나 다른 브라우저에서는 기록이 자동으로 공유되지 않습니다.
- 기록을 옮기려면 `기록 내보내기 / 가져오기` 기능을 사용해야 합니다.

저장 로직은 [`src/storage.ts`](/Users/habyungro/devRoot/network_master/src/storage.ts)에서 처리합니다.

## 로컬 개발 실행

Docker 없이 개발 서버로 실행하려면 Node.js 환경이 필요합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

## 문제 데이터 갱신

기본 권장 방식은 Docker 기반 데이터 생성입니다.

```bash
docker compose run --rm data-builder
```

관련 파일:

- [`docker-compose.yml`](/Users/habyungro/devRoot/network_master/docker-compose.yml)
- [`docker/data-builder.Dockerfile`](/Users/habyungro/devRoot/network_master/docker/data-builder.Dockerfile)
- [`requirements-data.txt`](/Users/habyungro/devRoot/network_master/requirements-data.txt)
- [`scripts/build_exam_json.py`](/Users/habyungro/devRoot/network_master/scripts/build_exam_json.py)
- [`scripts/analyze_pdfs.py`](/Users/habyungro/devRoot/network_master/scripts/analyze_pdfs.py)

원하면 로컬 Python 환경에서도 직접 실행할 수 있지만, 기본 사용 경로는 Docker 방식입니다.

## 파일 위치

- 앱 진입점: [`src/App.tsx`](/Users/habyungro/devRoot/network_master/src/App.tsx)
- 문제 데이터 로딩: [`src/data.ts`](/Users/habyungro/devRoot/network_master/src/data.ts)
- 사용자 기록 저장: [`src/storage.ts`](/Users/habyungro/devRoot/network_master/src/storage.ts)
