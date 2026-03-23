# Developer Guide

이 문서는 개발자용 문서입니다.  
일반 사용 방법은 [README.md](/README.md)를 참고하면 됩니다.

## 기술 스택

- 프론트엔드: React + Vite + TypeScript
- 스타일: Tailwind CSS
- 문제 데이터: [generated/exams.json](/generated/exams.json)
- 원본 PDF: [docs/pdfs](/docs/pdfs) ([출처](https://www.gunsys.com/gunsystem_pilgi.htm?cbt=net2))
- 운영 배포: AWS S3 + CloudFront

## 프로젝트 구조

- 앱 진입점: [src/main.tsx](/src/main.tsx)
- 메인 화면: [src/App.tsx](/src/App.tsx)
- 문제 데이터 로더: [src/data.ts](/src/data.ts)
- 로컬 저장 로직: [src/storage.ts](/src/storage.ts)
- 타입 정의: [src/types.ts](/src/types.ts)
- PDF 분석 스크립트: [scripts/analyze_pdfs.py](/scripts/analyze_pdfs.py)
- PDF -> JSON 생성기: [scripts/build_exam_json.py](/scripts/build_exam_json.py)

## 데이터 생성 흐름

문제 데이터는 PDF에서 직접 읽지 않고, 미리 JSON으로 변환한 뒤 앱에서 사용합니다.

흐름은 아래와 같습니다.

1. `docs/pdfs` 폴더의 PDF를 읽습니다.
2. 1페이지의 답안표에서 정답을 추출합니다.
3. 2페이지부터 문제 본문을 추출합니다.
4. 각 PDF에서 50문항과 정답 50개를 매칭합니다.
5. 결과를 [generated/exams.json](/generated/exams.json)에 저장합니다.

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

수동 배포 시 반복 작업을 줄이기 위해 [`scripts/deploy_s3.sh`](/Users/habyungro/devRoot/network_master/scripts/deploy_s3.sh) 를 제공합니다.

필요한 환경변수:

- `AWS_S3_BUCKET`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` 선택

예시:

```bash
cp .env.example .env
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
python scripts/build_exam_json.py
```

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
  - 사이드바 접힘 상태
  - 현재 탭
  - 현재 출제 필터
  - 해설 노트 검색창 열림 상태는 현재 미저장

## 참고

이 프로젝트는 현재 여러 기기 자동 동기화 대신 `JSON 내보내기 / 가져오기` 방식으로 기록을 옮기도록 설계되어 있습니다.

## 최근 UI 추가

- `미풀이 문제 우선 보기` 토글
  - UI 상태에 저장됩니다.
  - 활성화하면 `전체 문제` 필터만 사용 가능하며, 다음 문제 선택 시 `attempts === 0`인 문제를 우선적으로 뽑습니다.
- `진행상황 보기` 토글
  - UI 상태에 저장됩니다.
  - 현재 과목 기준 진행률 카드와 퍼센트 바 표시 여부를 제어합니다.
  - 진행률은 `solved / total` 계산으로 렌더 시점에 갱신됩니다.
