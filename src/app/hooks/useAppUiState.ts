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
    sidebarOpen,
    view,
  }
}
