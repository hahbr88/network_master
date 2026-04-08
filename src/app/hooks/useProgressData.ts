import { useEffect, useMemo, useState } from 'react'
import type { ProgressMap } from '../../types'
import {
  clearActiveExamSession,
  clearExamHistory,
  exportProgress,
  importProgress,
  loadActiveExamSession,
  loadExamHistory,
  loadProgress,
  mergeActiveExamSession,
  mergeExamHistory,
  mergeProgress,
  saveActiveExamSession,
  saveExamHistory,
  saveProgress,
} from '../../storage'

export function useProgressData() {
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    loadProgress(),
  )
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dataRevision, setDataRevision] = useState(0)

  const exportText = useMemo(
    () =>
      exportProgress(
        progressMap,
        loadActiveExamSession(),
        loadExamHistory(),
      ),
    [dataRevision, progressMap],
  )

  useEffect(() => {
    saveProgress(progressMap)
  }, [progressMap])

  useEffect(() => {
    if (!importStatus) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setImportStatus(null)
    }, 2800)

    return () => window.clearTimeout(timeoutId)
  }, [importStatus])

  const handleImport = () => {
    try {
      const incoming = importProgress(importText)
      setProgressMap((previous) => mergeProgress(previous, incoming.progress))

      const mergedSession = mergeActiveExamSession(
        loadActiveExamSession(),
        incoming.activeExamSession,
      )
      const mergedHistory = mergeExamHistory(
        loadExamHistory(),
        incoming.examHistory,
      )

      if (mergedSession) {
        saveActiveExamSession(mergedSession)
      } else {
        clearActiveExamSession()
      }

      saveExamHistory(mergedHistory)
      setDataRevision((previous) => previous + 1)
      setImportStatus('모의고사 정보까지 기록을 가져왔습니다.')
      setImportText('')
    } catch {
      setImportStatus('올바른 JSON 형식이 아닙니다.')
    }
  }

  const handleReset = () => {
    setProgressMap({})
    clearActiveExamSession()
    clearExamHistory()
    setDataRevision((previous) => previous + 1)
    setImportText('')
    setImportStatus('저장된 사용자 기록을 모두 초기화했습니다.')
  }

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleDownloadExport = () => {
    const blob = new Blob([exportText], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const dateLabel = new Date().toISOString().slice(0, 10)
    const anchor = document.createElement('a')

    anchor.href = downloadUrl
    anchor.download = `study-log-${dateLabel}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  return {
    copied,
    dataRevision,
    exportText,
    handleCopyExport,
    handleDownloadExport,
    handleImport,
    handleReset,
    importStatus,
    importText,
    progressMap,
    setImportStatus,
    setImportText,
    setProgressMap,
  }
}
