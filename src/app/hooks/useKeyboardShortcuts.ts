import { useEffect } from 'react'

type UseKeyboardShortcutsParams = {
  nextConfirmOpen: boolean
  resetConfirmOpen: boolean
  revealed: boolean
  selected: number | null
  onConfirmNextQuestion: () => void
  onCloseNextConfirm: () => void
  onOpenNextConfirm: () => void
  onConfirmReset: () => void
  onCloseResetConfirm: () => void
  onSubmitAnswer: () => void
}

export function useKeyboardShortcuts({
  nextConfirmOpen,
  resetConfirmOpen,
  revealed,
  selected,
  onConfirmNextQuestion,
  onCloseNextConfirm,
  onOpenNextConfirm,
  onConfirmReset,
  onCloseResetConfirm,
  onSubmitAnswer,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      if (resetConfirmOpen) {
        if (event.key === 'Enter') {
          event.preventDefault()
          onConfirmReset()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          onCloseResetConfirm()
        }
        return
      }

      if (nextConfirmOpen) {
        if (event.key === 'Enter') {
          event.preventDefault()
          onConfirmNextQuestion()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          onCloseNextConfirm()
        }
        return
      }

      if (event.key === 'Tab' && revealed) {
        event.preventDefault()
        onOpenNextConfirm()
        return
      }

      if (event.key === 'Enter' && selected !== null && !revealed) {
        event.preventDefault()
        onSubmitAnswer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    nextConfirmOpen,
    onCloseNextConfirm,
    onCloseResetConfirm,
    onConfirmNextQuestion,
    onConfirmReset,
    onOpenNextConfirm,
    onSubmitAnswer,
    resetConfirmOpen,
    revealed,
    selected,
  ])
}
