import type {
  ActiveExamSession,
  ChoiceNumber,
  ExamHistoryEntry,
  ProgressMap,
  QuestionProgress,
  UserDataExport,
} from './types'

const STORAGE_KEY = 'network-master-user-data'
const ACTIVE_EXAM_SESSION_KEY = 'network-master-active-exam-session'
const EXAM_HISTORY_KEY = 'network-master-exam-history'

export function getQuestionKey(examId: string, number: number) {
  return `${examId}-${number}`
}

export function createEmptyProgress(): QuestionProgress {
  return {
    attempts: 0,
    correctCount: 0,
    wrongCount: 0,
    lastSolvedAt: null,
    lastSelectedChoice: null,
    lastWasCorrect: null,
    choiceNotes: {},
  }
}

export function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isUserDataExport(parsed)) {
      return normalizeProgressMap(parsed.progress)
    }
    if (isProgressMap(parsed)) {
      return normalizeProgressMap(parsed)
    }
    return {}
  } catch {
    return {}
  }
}

export function saveProgress(progress: ProgressMap) {
  if (typeof window === 'undefined') {
    return
  }

  const payload: UserDataExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadActiveExamSession(): ActiveExamSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(ACTIVE_EXAM_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return isActiveExamSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveActiveExamSession(session: ActiveExamSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACTIVE_EXAM_SESSION_KEY, JSON.stringify(session))
}

export function clearActiveExamSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ACTIVE_EXAM_SESSION_KEY)
}

export function loadExamHistory(): ExamHistoryEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(EXAM_HISTORY_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter(isExamHistoryEntry).sort(sortExamHistoryDesc)
      : []
  } catch {
    return []
  }
}

export function appendExamHistory(entry: ExamHistoryEntry) {
  if (typeof window === 'undefined') {
    return
  }

  const current = loadExamHistory()
  const deduped = current.filter(
    (item) =>
      !(
        item.examId === entry.examId &&
        item.startedAt === entry.startedAt &&
        item.completedAt === entry.completedAt
      ),
  )

  const next = [entry, ...deduped].sort(sortExamHistoryDesc)
  window.localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(next))
}

export function mergeProgress(current: ProgressMap, incoming: ProgressMap): ProgressMap {
  const merged: ProgressMap = { ...current }

  for (const [key, nextValue] of Object.entries(incoming)) {
    const currentValue = merged[key] ?? createEmptyProgress()
    merged[key] = {
      attempts: Math.max(currentValue.attempts, nextValue.attempts),
      correctCount: Math.max(currentValue.correctCount, nextValue.correctCount),
      wrongCount: Math.max(currentValue.wrongCount, nextValue.wrongCount),
      lastSolvedAt: pickLatestDate(currentValue.lastSolvedAt, nextValue.lastSolvedAt),
      lastSelectedChoice: nextValue.lastSelectedChoice ?? currentValue.lastSelectedChoice,
      lastWasCorrect:
        nextValue.lastSolvedAt && nextValue.lastSolvedAt === pickLatestDate(currentValue.lastSolvedAt, nextValue.lastSolvedAt)
          ? nextValue.lastWasCorrect
          : currentValue.lastWasCorrect,
      choiceNotes: {
        ...currentValue.choiceNotes,
        ...nextValue.choiceNotes,
      },
    }
  }

  return merged
}

export function exportProgress(progress: ProgressMap): string {
  const payload: UserDataExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress,
  }
  return JSON.stringify(payload, null, 2)
}

export function importProgress(raw: string): ProgressMap {
  const parsed: unknown = JSON.parse(raw)
  const progress = isUserDataExport(parsed) ? parsed.progress : parsed

  if (!isProgressMap(progress)) {
    throw new Error('Invalid progress payload')
  }

  return normalizeProgressMap(progress)
}

export function updateQuestionAttempt(
  previous: QuestionProgress | undefined,
  selectedChoice: number,
  answer: number,
): QuestionProgress {
  const base = previous ?? createEmptyProgress()
  const choice = selectedChoice as ChoiceNumber
  const correct = selectedChoice === answer

  return {
    ...base,
    attempts: base.attempts + 1,
    correctCount: base.correctCount + (correct ? 1 : 0),
    wrongCount: base.wrongCount + (correct ? 0 : 1),
    lastSolvedAt: new Date().toISOString(),
    lastSelectedChoice: choice,
    lastWasCorrect: correct,
  }
}

export function updateChoiceNote(
  previous: QuestionProgress | undefined,
  choice: ChoiceNumber,
  note: string,
): QuestionProgress {
  const base = previous ?? createEmptyProgress()
  const nextNotes = { ...base.choiceNotes }

  if (note.trim()) {
    nextNotes[choice] = note
  } else {
    delete nextNotes[choice]
  }

  return {
    ...base,
    choiceNotes: nextNotes,
  }
}

function pickLatestDate(a: string | null, b: string | null) {
  if (!a) {
    return b
  }
  if (!b) {
    return a
  }
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b
}

function isUserDataExport(value: unknown): value is UserDataExport {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<UserDataExport>
  return candidate.version === 1 && typeof candidate.exportedAt === 'string' && !!candidate.progress
}

function isProgressMap(value: unknown): value is ProgressMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(isQuestionProgress)
}

function isQuestionProgress(value: unknown): value is QuestionProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as Partial<QuestionProgress>

  return (
    typeof candidate.attempts === 'number' &&
    typeof candidate.correctCount === 'number' &&
    typeof candidate.wrongCount === 'number' &&
    (candidate.lastSolvedAt === null || typeof candidate.lastSolvedAt === 'string') &&
    (candidate.lastSelectedChoice === null ||
      candidate.lastSelectedChoice === 1 ||
      candidate.lastSelectedChoice === 2 ||
      candidate.lastSelectedChoice === 3 ||
      candidate.lastSelectedChoice === 4) &&
    (candidate.lastWasCorrect === undefined ||
      candidate.lastWasCorrect === null ||
      typeof candidate.lastWasCorrect === 'boolean') &&
    isChoiceNotes(candidate.choiceNotes)
  )
}

function isChoiceNotes(value: unknown): boolean {
  if (value === undefined) {
    return true
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.entries(value).every(([key, note]) => {
    return ['1', '2', '3', '4'].includes(key) && typeof note === 'string'
  })
}

function isActiveExamSession(value: unknown): value is ActiveExamSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as Partial<ActiveExamSession>

  return (
    typeof candidate.examId === 'string' &&
    typeof candidate.currentIndex === 'number' &&
    isExamSessionAnswerMap(candidate.answers) &&
    (candidate.selectedChoice === null ||
      candidate.selectedChoice === 1 ||
      candidate.selectedChoice === 2 ||
      candidate.selectedChoice === 3 ||
      candidate.selectedChoice === 4) &&
    typeof candidate.revealed === 'boolean' &&
    typeof candidate.startedAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

function isExamHistoryEntry(value: unknown): value is ExamHistoryEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as Partial<ExamHistoryEntry>

  return (
    typeof candidate.examId === 'string' &&
    typeof candidate.examTitle === 'string' &&
    (candidate.examDate === null || typeof candidate.examDate === 'string') &&
    (candidate.round === null || typeof candidate.round === 'number') &&
    typeof candidate.totalQuestions === 'number' &&
    typeof candidate.answeredCount === 'number' &&
    typeof candidate.correctCount === 'number' &&
    typeof candidate.wrongCount === 'number' &&
    typeof candidate.score === 'number' &&
    Array.isArray(candidate.subjectStats) &&
    candidate.subjectStats.every(isExamHistorySubjectStat) &&
    typeof candidate.startedAt === 'string' &&
    typeof candidate.completedAt === 'string'
  )
}

function isExamHistorySubjectStat(
  value: unknown,
): value is ExamHistoryEntry['subjectStats'][number] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as ExamHistoryEntry['subjectStats'][number]
  return (
    typeof candidate.subject === 'string' &&
    typeof candidate.total === 'number' &&
    typeof candidate.correct === 'number'
  )
}

function isExamSessionAnswerMap(
  value: unknown,
): value is ActiveExamSession['answers'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.entries(value).every(([key, answer]) => {
    return typeof key === 'string' && isExamSessionAnswer(answer)
  })
}

function isExamSessionAnswer(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const candidate = value as ActiveExamSession['answers'][string]
  return (
    (candidate.selectedChoice === 1 ||
      candidate.selectedChoice === 2 ||
      candidate.selectedChoice === 3 ||
      candidate.selectedChoice === 4) &&
    typeof candidate.correct === 'boolean'
  )
}

function sortExamHistoryDesc(a: ExamHistoryEntry, b: ExamHistoryEntry) {
  return (
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
}

function normalizeProgressMap(progress: ProgressMap): ProgressMap {
  return Object.fromEntries(
    Object.entries(progress).map(([key, value]) => [
      key,
      {
        attempts: value.attempts,
        correctCount: value.correctCount,
        wrongCount: value.wrongCount,
        lastSolvedAt: value.lastSolvedAt ?? null,
        lastSelectedChoice: value.lastSelectedChoice ?? null,
        lastWasCorrect: value.lastWasCorrect ?? null,
        choiceNotes: value.choiceNotes ?? {},
      },
    ]),
  )
}
