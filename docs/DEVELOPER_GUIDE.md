# Developer Guide

이 문서는 개발자용 문서입니다.  
일반 사용 방법은 [README.md](/README.md)를 참고하면 됩니다.

## 개요

현재 프로젝트는 네트워크관리사 2급 기출 PDF를 JSON으로 변환해 정적 웹앱에서 문제를 풀 수 있게 만든 구조입니다.  
여기에 Gemini API를 사용한 문제 해설과 선택지별 해설 생성 기능이 추가되어 있습니다.  
사용자 풀이 기록과 메모는 브라우저 `localStorage`에 저장되고, 문제 데이터는 `generated/exams.json`을 읽어 사용합니다.

## 데이터 생성 파이프라인

문제 데이터 생성 흐름은 아래와 같습니다.

1. `docs/pdfs`의 원본 PDF를 읽습니다.
2. PDF에서 회차별 문제, 선택지, 정답을 추출합니다.
3. 결과를 `generated/exams.json`으로 저장합니다.
4. 필요하면 Gemini API로 문제 해설과 선택지별 해설을 생성합니다.
5. 생성된 해설은 캐시 파일과 `generated/exams.json`에 함께 반영됩니다.

Gemini 해설 생성 흐름은 아래와 같습니다.

1. 해설이 없는 문항만 골라 배치 단위로 요청합니다.
2. 기본값은 `5문항씩 1요청`입니다.
3. 응답이 오면 문항별 `answerExplanation`, `choiceExplanations`를 저장합니다.
4. 성공한 배치는 즉시 캐시와 `generated/exams.json`에 반영됩니다.
5. quota 또는 rate limit에 걸리면 현재 진행 위치를 출력하고 종료합니다.
6. 같은 명령을 다시 실행하면 캐시를 기준으로 이어서 진행합니다.

## 배포 전략

이 프로젝트는 API 서버나 DB 없이 동작하는 정적 웹앱입니다.

- 앱 파일은 `npm run build`로 생성한 `dist/`를 배포한다.
- 사용자 데이터는 서버가 아니라 브라우저 `localStorage`에 저장된다.
- 여러 기기 자동 동기화 대신 `JSON export/import`로 기록을 옮기도록 설계되어 있다.

따라서 운영 배포는 Docker 서버 운영보다 `S3 + CloudFront` 정적 호스팅을 기본 경로로 두는 것이 단순하다.

### 권장 운영 배포 흐름

1. `npm install`
2. `npm run build`
3. 생성된 `dist/`를 S3 버킷에 업로드
4. 필요하면 CloudFront를 앞단에 연결

### AWS 리소스 권장 설정

- S3 버킷: 정적 파일 저장
- CloudFront: HTTPS 제공 및 캐시 처리
- CloudFront Origin Access Control(OAC): S3 직접 공개 대신 CloudFront만 접근 허용
- Default root object: `index.html`

현재 앱은 클라이언트 라우터를 쓰지 않으므로, 지금 단계에서는 SPA 404 fallback 설정이 필수는 아닙니다.

### 배포 스크립트 사용

수동 배포 시 반복 작업을 줄이기 위해 [`scripts/deploy_s3.sh`](/scripts/deploy_s3.sh) 를 제공합니다.

필요한 환경변수:

- `AWS_S3_BUCKET`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` 선택

예시:

```bash
cp .env
# .env 값을 실제 배포 환경에 맞게 수정
npm run build
npm run deploy:s3
```

동작:

- `dist/`를 `aws s3 sync`로 업로드
- Distribution ID가 있으면 `/*` 경로 무효화 실행

로컬에서는 `.env`를 사용하고, CI/CD에서는 GitHub Actions 환경변수나 secret으로 주입하면 됩니다.

현재 방식은 사용자가 직접 명령을 실행하는 수동 배포이며, GitHub Actions 같은 워크플로우를 붙이면 그때부터 CI/CD 자동 배포로 확장할 수 도 있음.

### 운영 시 주의할 점

- `localStorage`는 브라우저와 도메인 기준으로 분리됩니다.
- 배포 도메인이나 경로를 바꾸면 기존 기록이 이어지지 않을 수 있습니다.
- 브라우저 데이터 삭제 시 기록도 함께 삭제됩니다.
- 기기 간 자동 동기화는 지원하지 않습니다.
- `aws s3 sync --delete`를 사용하므로 버킷 대상 경로는 이 앱 전용으로 두는 편이 안전합니다.

## PDF 갱신 방법

새 PDF를 `docs/pdfs` 폴더에 추가한 뒤 아래 명령을 실행하면 JSON이 다시 생성됩니다.

```bash
npm run data:deps
npm run data:build
```

직접 실행이 필요하면 `sh scripts/run_python.sh scripts/build_exam_json.py`를 사용하면 macOS처럼 `python` 대신 `python3`만 있는 환경도 함께 처리합니다.
기본 `npm run data:build`는 JSON 재생성 후 `generated/choice_explanations_cache.json`의 해설 캐시를 다시 반영합니다.

Docker 기반으로 데이터만 다시 만들려면 아래 명령을 사용합니다.

```bash
docker compose run --rm data-builder
```

데이터가 갱신된 뒤 컨테이너 확인 환경까지 다시 반영하려면:

```bash
docker compose up --build
```

## 로컬 개발

개발 중 확인은 기본적으로 Vite 로컬 서버를 사용합니다.

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

포맷팅:

```bash
npm run format
npm run format:check
```

## Docker 사용

Docker는 운영 배포 기본 경로가 아니라 아래 경우에만 사용하는 보조 도구입니다.

- nginx 기반 정적 서빙 결과를 컨테이너로 확인할 때
- 데이터 생성 스크립트를 로컬 환경과 분리해 실행할 때

기본 실행:

```bash
docker compose up --build
```

다시 실행:

```bash
docker compose up
```

백그라운드 실행:

```bash
docker compose up -d
```

중지:

```bash
docker compose down
```

참고 파일:

- [Dockerfile](/Dockerfile)
- [docker-compose.yml](/docker-compose.yml)
- [docker/nginx.conf](/docker/nginx.conf)

## 현재 앱 기능

### 문제 풀이

- 랜덤 1문제 출제
- 과목 필터
- `전체 / 틀린 문제만 / 메모 있는 문제만` 필터
- `Enter`로 정답 확인
- 정답 확인 후 `Tab`으로 다음 문제 확인 팝업 표시
- 팝업에서 `Enter`로 다음 문제 이동, `Esc`로 취소

### 풀이 기록

- 문제별 시도 횟수
- 맞은 횟수 / 틀린 횟수
- 마지막 선택 / 마지막 정오답
- 마지막 풀이 시점

### 메모

- 선택지별 메모 작성
- 메모는 기본 숨김, 필요할 때만 펼침
- 해설 노트 탭에서 메모가 있는 문제만 별도 학습 가능
- 한 문제에 메모가 여러 개 있으면 문제 단위로 묶어서 표시
- 해설 노트에서 문제 본문 / 선택지 / 메모 내용 검색 가능
- 검색창은 기본 숨김, 아이콘 버튼으로 열기
- `5개 / 10개 / 20개씩 보기` 페이지네이션 지원
- `메모 있는 문제만 다시 풀기` 버튼으로 퀴즈 필터와 연결

### 기록 이전

- JSON export
- JSON import
- 구조 검증 후에만 import 허용

## 로컬 저장 구조

사용자 데이터는 현재 서버 DB 없이 브라우저 `localStorage`에 저장합니다.

관련 구현 파일:

- [src/storage.ts](/src/storage.ts)
- [src/types.ts](/src/types.ts)

저장되는 정보:

- 문제별 풀이 기록
- 선택지별 메모
- UI 상태 일부
  - 상단 헤더 접힘 상태
  - 설정바 접힘 상태
  - 현재 탭
  - 현재 출제 필터
  - 미풀이 우선 출제 여부
  - 풀이 기록 패널 열림 상태
  - 해설 노트 검색창 열림 상태는 현재 미저장

## 참고

이 프로젝트는 현재 여러 기기 자동 동기화 대신 `JSON 내보내기 / 가져오기` 방식으로 기록을 옮기도록 설계되어 있습니다.


## Gemini API 키 운용

여러 API 키를 순차적으로 사용할 수 있습니다.

```env
GEMINI_API_KEYS=key1,key2,key3
```

동작 방식:

1. 키를 앞에서부터 순서대로 사용합니다.
2. 현재 키가 `429 RESOURCE_EXHAUSTED`에 걸리면 다음 키로 넘어갑니다.
3. 모든 키가 막히면 중단 메시지를 출력하고 종료합니다.

주의:

- 같은 Google 프로젝트에서 발급한 키들은 quota를 공유할 수 있습니다.
- 서로 다른 프로젝트의 키일 때 우회 효과가 더 큽니다.

## 실행 명령어

기본 JSON 생성:

```bash
npm run data:deps
npm run data:build
```

Gemini 해설 포함 생성:

```bash
npm run data:build:explanations
```

배치 크기 지정:

```bash
sh scripts/run_python.sh scripts/build_exam_json.py --with-choice-explanations --requests-per-minute 5 --batch-size 5
```

캐시만 다시 반영:

```bash
npm run data:build:cache
```

프런트 로컬 실행:

```bash
npm install
npm run dev
```

프런트 빌드:

```bash
npm run build
```

## 현재 상태

현재 기준으로 정리하면:

- `generated/exams.json`에 전체 `800문항`이 들어 있습니다.
- 전체 `800문항` 모두 `answerExplanation`, `choiceExplanations`가 반영된 상태입니다.
- 문제 해설과 선택지 해설은 Gemini API로 생성한 결과를 사용합니다.
- 해설 캐시는 `generated/choice_explanations_cache.json`에 저장됩니다.
- 새 해설이 생성되면 캐시와 `generated/exams.json`이 함께 갱신됩니다.
- 클라이언트에서는 정답 공개 후 문제/선택지별 `AI 해설 보기` 버튼으로 확인할 수 있습니다.
- AI 해설 UI는 기본 숨김 상태이고, 버튼별로 독립적으로 열고 닫을 수 있습니다.

## 운영 메모

- 무료 티어에서는 분당 제한과 일일 요청 제한이 함께 걸릴 수 있습니다.
- 요청이 중단되어도 캐시가 남기 때문에 같은 명령으로 이어서 실행하면 됩니다.
- README에는 사용자 관점의 기능과 사용 방법만 유지하고, 이 문서에는 개발/운영 흐름만 정리합니다.
