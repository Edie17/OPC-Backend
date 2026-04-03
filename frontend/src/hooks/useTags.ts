import { useEffect, useState, useCallback } from 'react'
import { tagsApi } from '../api/tagsApi'
import type { Tag, TagValue } from '../types'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await tagsApi.getAll()
      setTags(data)
      setError(null)
    } catch {
      setError('Nepodařilo se načíst tagy.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { tags, loading, error, reload: load }
}

export function useCurrentValues() {
  const [values, setValues] = useState<Map<number, TagValue>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tagsApi.getAllCurrentValues().then(data => {
      setValues(new Map(data.map(v => [v.tagId, v])))
    }).finally(() => setLoading(false))
  }, [])

  return { values, loading }
}
