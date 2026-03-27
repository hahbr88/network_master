import { useEffect, useMemo, useState } from 'react'
import type { ProgressMap } from '../../types'
import {
  exportProgress,
  importProgress,
  loadProgress,
  mergeProgress,
  saveProgress,
} from '../../storage'

export function useProgressData() {
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    loadProgress(),
  )
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const exportText = useMemo(() => exportProgress(progressMap), [progressMap])

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
      setProgressMap((previous) => mergeProgress(previous, incoming))
      setImportStatus('기록을 가져왔습니다.')
      setImportText('')
    } catch {
      setImportStatus('올바른 JSON 형식이 아니라서 가져오지 못했습니다.')
    }
  }

  const handleReset = () => {
    setProgressMap({})
    setImportText('')
    setImportStatus('기록이 초기화되었습니다.')
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

  return {
    copied,
    exportText,
    handleCopyExport,
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
