# Developer Guide

이 문서는 개발자용 문서입니다.  
일반 사용 방법은 [README.md](/README.md)를 참고하면 됩니다.

## 기술 스택

- 프론트엔드: React + Vite + TypeScript
- 스타일: Tailwind CSS
- 문제 데이터: [generated/exams.json](/generated/exams.json)
- 원본 PDF: [docs/pdfs](/docs/pdfs) ([출처](https://www.gunsys.com/gunsystem_pilgi.htm?cbt=net2))

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

## PDF 갱신 방법

새 PDF를 `docs/pdfs` 폴더에 추가한 뒤 아래 명령을 실행하면 JSON이 다시 생성됩니다.

```bash
python scripts/build_exam_json.py
```

Docker 기반으로 데이터만 다시 만들려면 아래 명령을 사용합니다.

```bash
docker compose run --rm data-builder
```

데이터가 갱신된 뒤 앱 이미지까지 다시 반영하려면:

```bash
docker compose up --build
```

## Docker 실행 (권장)

실행환경 충돌을 줄이기 위해 개발 중에도 가능하면 도커 실행을 기본 경로로 사용하는 것을 권장합니다.

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

## 로컬 개발

로컬 실행은 도커 대신 직접 Node 환경에서 확인해야 할 때 사용하는 보조 경로입니다.

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
