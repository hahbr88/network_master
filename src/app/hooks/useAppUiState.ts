import { useEffect, useState } from 'react'
import type { AppView, QuizFilter, QuizMode } from '../types'
import { loadUiState, saveUiState } from '../utils'

export function useAppUiState(defaultExamId: string | null) {
  const initialUiState = loadUiState()

  const [sidebarOpen, setSidebarOpen] = useState(initialUiState.sidebarOpen)
  const [view, setView] = useState<AppView>(initialUiState.view)
  const [quizFilter, setQuizFilter] = useState<QuizFilter>(
    initialUiState.quizFilter,
  )
  const [quizMode, setQuizMode] = useState<QuizMode>(initialUiState.quizMode)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    initialUiState.selectedExamId ?? defaultExamId,
  )
  const [prioritizeUnsolved, setPrioritizeUnsolved] = useState(
    initialUiState.prioritizeUnsolved,
  )
  const [progressOpen, setProgressOpen] = useState(initialUiState.progressOpen)
  const [reviewQuestionKeys, setReviewQuestionKeys] = useState(
    initialUiState.reviewQuestionKeys,
  )

  useEffect(() => {
    saveUiState({
      titleOpen: initialUiState.titleOpen,
      sidebarOpen,
      view,
      quizFilter,
      quizMode,
      selectedExamId,
      prioritizeUnsolved,
      progressOpen,
      reviewQuestionKeys,
    })
  }, [
    initialUiState.titleOpen,
    sidebarOpen,
    view,
    quizFilter,
    quizMode,
    selectedExamId,
    prioritizeUnsolved,
    progressOpen,
    reviewQuestionKeys,
  ])

  return {
    prioritizeUnsolved,
    progressOpen,
    quizFilter,
    quizMode,
    selectedExamId,
    setPrioritizeUnsolved,
    setProgressOpen,
    setQuizFilter,
    setQuizMode,
    setSelectedExamId,
    setSidebarOpen,
    setView,
    setReviewQuestionKeys,
    sidebarOpen,
    view,
    reviewQuestionKeys,
  }
}
