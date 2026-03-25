# Developer Guide

이 문서는 개발자용 요약 문서입니다.  
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
python scripts/build_exam_json.py
```

Gemini 해설 포함 생성:

```bash
python scripts/build_exam_json.py --with-choice-explanations --requests-per-minute 5
```

배치 크기 지정:

```bash
python scripts/build_exam_json.py --with-choice-explanations --requests-per-minute 5 --batch-size 5
```

캐시만 다시 반영:

```bash
python scripts/build_exam_json.py --apply-explanation-cache
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
