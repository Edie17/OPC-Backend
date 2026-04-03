import { useState, useCallback } from 'react'
import { historyApi } from '../api/historyApi'
import type { HistoricalValue } from '../types'

export function useHistory() {
  const [data, setData] = useState<HistoricalValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (tagId: number, from: string, to: string, maxCount = 500) => {
    try {
      setLoading(true)
      setError(null)
      const result = await historyApi.getByTagId(tagId, from, to, maxCount)
      setData(result)
    } catch {
      setError('Nepodařilo se načíst historická data.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, load }
}
