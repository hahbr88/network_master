import type { QuestionCard, QuestionProgress } from '../types'
import type { UiState } from './types'

export const LABEL_ALL = '전체'
export const TEXT_UNKNOWN_ROUND = '회차 정보 없음'
export const TEXT_NOT_SOLVED = '미풀이'
export const TEXT_CORRECT = '정답입니다.'
export const TEXT_WRONG = '오답입니다.'

const UI_STATE_STORAGE_KEY = 'network-master-ui-state'

export const DEFAULT_UI_STATE: UiState = {
  titleOpen: true,
  sidebarOpen: true,
  view: 'quiz',
  quizFilter: 'all',
  prioritizeUnsolved: true,
  progressOpen: true,
}

export function pickRandomQuestion(
  pool: QuestionCard[],
  previousId?: string,
) {
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

export function getQuestionId(question: QuestionCard) {
  return `${question.examId}-${question.number}`
}

export function formatExamLabel(question: QuestionCard) {
  const date = question.examDate ?? question.examId
  const round = question.round ? `${question.round}회` : TEXT_UNKNOWN_ROUND
  return `${date} / ${round} / ${question.subject}`
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
      prioritizeUnsolved:
        parsed.prioritizeUnsolved ?? DEFAULT_UI_STATE.prioritizeUnsolved,
      progressOpen: parsed.progressOpen ?? DEFAULT_UI_STATE.progressOpen,
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
