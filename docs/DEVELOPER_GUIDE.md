# Developer Guide

이 문서는 개발자용 참고 문서입니다.  
일반 사용자용 안내는 [README.md](/README.md)를 기준으로 봅니다.

## 프로젝트 개요

- 프론트엔드: React + Vite + TypeScript
- 스타일: Tailwind CSS
- 문제 데이터: [generated/exams.json](/generated/exams.json)
- 원본 PDF: [docs](/docs)

## 데이터 생성 흐름

문제 데이터는 원본 PDF에서 추출해 JSON으로 만듭니다.

흐름:

1. `docs` 폴더의 PDF를 읽습니다.
2. 1페이지의 정답표를 파싱합니다.
3. 2페이지부터 문제 본문을 추출합니다.
4. 50문항과 50개 정답을 조합합니다.
5. 결과를 [generated/exams.json](/generated/exams.json)에 기록합니다.

관련 파일:

- [scripts/analyze_pdfs.py](/scripts/analyze_pdfs.py)
- [scripts/build_exam_json.py](/scripts/build_exam_json.py)

## 로컬 개발

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

포맷:

```bash
npm run format
npm run format:check
```

## Docker 실행

일반 사용자 안내는 `docker compose up --build` 기준으로 두고, 이 문서에서는 개별 명령도 함께 정리합니다.

### Compose로 실행

```bash
docker compose up --build
```

다시 실행만 할 때:

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

### 이미지 직접 빌드 / 실행

이미지 빌드:

```bash
docker build -t network-master .
```

컨테이너 실행:

```bash
docker run --rm -p 4173:80 network-master
```

관련 파일:

- [Dockerfile](/Dockerfile)
- [docker-compose.yml](/docker-compose.yml)
- [docker/nginx.conf](/docker/nginx.conf)

## PDF 추가 후 데이터 갱신

새 PDF를 [docs](/docs)에 넣은 뒤 JSON을 다시 생성해야 합니다.

로컬 Python으로 실행:

```bash
python scripts/build_exam_json.py
```

Docker 데이터 빌더로 실행:

```bash
docker compose run --rm data-builder
```

그 다음 프론트 이미지를 다시 빌드합니다.

```bash
docker compose up --build
```

## 사용자 기록 저장 방식

사용자 풀이 기록은 서버 DB가 아니라 브라우저 `localStorage`에 저장됩니다.

관련 파일:

- [src/storage.ts](/src/storage.ts)

저장 항목:

- 문제별 풀이 횟수
- 맞은 횟수 / 틀린 횟수
- 마지막 선택 결과
- 선택지별 메모
- JSON export / import

## 주요 파일

- 앱 진입점: [src/main.tsx](/src/main.tsx)
- 메인 화면: [src/App.tsx](/src/App.tsx)
- 문제 데이터 로딩: [src/data.ts](/src/data.ts)
- 저장 로직: [src/storage.ts](/src/storage.ts)
- 타입 정의: [src/types.ts](/src/types.ts)
