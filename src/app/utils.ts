import type { ProgressMap, QuestionCard, QuestionProgress } from '../types'
import type { QuizMode, UiState } from './types'

export const LABEL_ALL = '전체'
export const TEXT_UNKNOWN_ROUND = '회차 정보 없음'
export const TEXT_NOT_SOLVED = '아직 풀이 전'
export const TEXT_CORRECT = '정답입니다.'
export const TEXT_WRONG = '오답입니다.'

const UI_STATE_STORAGE_KEY = 'network-master-ui-state'

export const DEFAULT_UI_STATE: UiState = {
  titleOpen: true,
  sidebarOpen: true,
  view: 'quiz',
  quizFilter: 'all',
  quizMode: 'random',
  selectedExamId: null,
  prioritizeUnsolved: true,
  progressOpen: true,
  reviewQuestionKeys: null,
}

export function pickRandomQuestion(pool: QuestionCard[], previousId?: string) {
  if (pool.length === 0) {
    return null
  }

  if (pool.length === 1) {
    return pool[0]
  }

  let candidate = pool[Math.floor(Math.random() * pool.length)]
  while (`${candidate.examId}-${candidate.number}` === previousId) {
    candidate = pool[Math.floor(Math.random() * pool.length)]
  }

  return candidate
}

type PickWeightedQuestionParams = {
  pool: QuestionCard[]
  progressMap: ProgressMap
  recentQuestionIds: string[]
  previousId?: string
}

export function pickWeightedQuestion({
  pool,
  progressMap,
  recentQuestionIds,
  previousId,
}: PickWeightedQuestionParams) {
  if (pool.length === 0) {
    return null
  }

  const candidatePool =
    previousId && pool.length > 1
      ? pool.filter((question) => getQuestionId(question) !== previousId)
      : pool

  if (candidatePool.length === 1) {
    return candidatePool[0]
  }

  const weightedPool = candidatePool.map((question) => {
    const questionId = getQuestionId(question)
    const progress = progressMap[questionId]

    return {
      question,
      weight: Math.max(
        0.2,
        1 +
          getLastWrongBonus(progress) +
          getWrongCountBonus(progress) +
          getStalenessBonus(progress) -
          getRecentExposurePenalty(questionId, recentQuestionIds),
      ),
    }
  })

  const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0)

  if (totalWeight <= 0) {
    return pickRandomQuestion(candidatePool, previousId)
  }

  let target = Math.random() * totalWeight
  for (const entry of weightedPool) {
    target -= entry.weight
    if (target <= 0) {
      return entry.question
    }
  }

  return weightedPool[weightedPool.length - 1]?.question ?? null
}

export function getQuestionId(question: QuestionCard) {
  return `${question.examId}-${question.number}`
}

export function formatExamLabel(question: QuestionCard) {
  const date = question.examDate ?? question.examId
  const round = question.round ? `${question.round}회` : TEXT_UNKNOWN_ROUND
  return `${date} / ${round} / ${question.subject}`
}

export function formatExamOnlyLabel(input: {
  examDate: string | null
  examId: string
  round: number | null
}) {
  const date = input.examDate ?? input.examId
  const round = input.round ? `${input.round}회` : TEXT_UNKNOWN_ROUND
  return `${date} / ${round}`
}

export function formatAttemptText(attempts: number) {
  return attempts <= 0 ? TEXT_NOT_SOLVED : `${attempts}회 풀이`
}

export function formatLastResult(progress: QuestionProgress) {
  if (
    !progress.attempts ||
    progress.lastSelectedChoice === null ||
    progress.lastWasCorrect === null
  ) {
    return TEXT_NOT_SOLVED
  }

  return `${progress.lastSelectedChoice}번 / ${
    progress.lastWasCorrect ? '정답' : '오답'
  }`
}

export function getQuizModeLabel(mode: QuizMode) {
  return mode === 'exam' ? '회차 모의고사' : '랜덤 문제'
}

export function loadUiState(): UiState {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_STATE
  }

  try {
    const raw = window.localStorage.getItem(UI_STATE_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_UI_STATE
    }

    const parsed = JSON.parse(raw) as Partial<UiState>
    return {
      titleOpen: parsed.titleOpen ?? DEFAULT_UI_STATE.titleOpen,
      sidebarOpen: parsed.sidebarOpen ?? DEFAULT_UI_STATE.sidebarOpen,
      view: parsed.view === 'notes' ? 'notes' : 'quiz',
      quizFilter:
        parsed.quizFilter === 'wrong' || parsed.quizFilter === 'noted'
          ? parsed.quizFilter
          : DEFAULT_UI_STATE.quizFilter,
      quizMode:
        parsed.quizMode === 'exam' ? parsed.quizMode : DEFAULT_UI_STATE.quizMode,
      selectedExamId:
        typeof parsed.selectedExamId === 'string' ? parsed.selectedExamId : null,
      prioritizeUnsolved:
        parsed.prioritizeUnsolved ?? DEFAULT_UI_STATE.prioritizeUnsolved,
      progressOpen: parsed.progressOpen ?? DEFAULT_UI_STATE.progressOpen,
      reviewQuestionKeys: Array.isArray(parsed.reviewQuestionKeys)
        ? parsed.reviewQuestionKeys.filter(
            (item): item is string => typeof item === 'string',
          )
        : DEFAULT_UI_STATE.reviewQuestionKeys,
    }
  } catch {
    return DEFAULT_UI_STATE
  }
}

export function saveUiState(state: UiState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(state))
}

function getLastWrongBonus(progress?: QuestionProgress) {
  return progress?.lastWasCorrect === false ? 5 : 0
}

function getWrongCountBonus(progress?: QuestionProgress) {
  return Math.min(progress?.wrongCount ?? 0, 5)
}

function getStalenessBonus(progress?: QuestionProgress) {
  if (!progress?.lastSolvedAt) {
    return 0
  }

  const solvedAt = new Date(progress.lastSolvedAt).getTime()
  if (Number.isNaN(solvedAt)) {
    return 0
  }

  const daysSinceSolved = (Date.now() - solvedAt) / (1000 * 60 * 60 * 24)

  if (daysSinceSolved >= 7) {
    return 3
  }
  if (daysSinceSolved >= 3) {
    return 2
  }
  if (daysSinceSolved >= 1) {
    return 1
  }

  return 0
}

function getRecentExposurePenalty(
  questionId: string,
  recentQuestionIds: string[],
) {
  const recentIndex = recentQuestionIds.indexOf(questionId)

  if (recentIndex === 0) {
    return 4
  }
  if (recentIndex === 1) {
    return 2
  }
  if (recentIndex === 2) {
    return 1
  }

  return 0
}
