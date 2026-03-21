import type { ChoiceNumber, QuestionCard, QuestionProgress } from '../types'

export type AppView = 'quiz' | 'notes'
export type QuizFilter = 'all' | 'wrong' | 'noted'

export type UiState = {
  titleOpen: boolean
  sidebarOpen: boolean
  view: AppView
  quizFilter: QuizFilter
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
