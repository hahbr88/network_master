import type { ChoiceNumber, QuestionCard, QuestionProgress } from '../types'

export type AppView = 'quiz' | 'notes'
export type QuizFilter = 'all' | 'wrong' | 'noted'
export type QuizMode = 'random' | 'exam'

export type UiState = {
  titleOpen: boolean
  sidebarOpen: boolean
  view: AppView
  quizFilter: QuizFilter
  quizMode: QuizMode
  selectedExamId: string | null
  prioritizeUnsolved: boolean
  progressOpen: boolean
}

export type NoteStudyItem = {
  id: string
  question: QuestionCard
  progress: QuestionProgress
  notes: Array<{
    choiceNumber: ChoiceNumber
    choiceText: string
    note: string
  }>
}
