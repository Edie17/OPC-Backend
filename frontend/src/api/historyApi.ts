import client from './client'
import type { HistoricalValue } from '../types'

export const historyApi = {
  getByTagId: (tagId: number, from: string, to: string, maxCount = 1000) =>
    client
      .get<HistoricalValue[]>(`/history/${tagId}`, {
        params: { from, to, maxCount },
      })
      .then(r => r.data),

  getByNodeId: (nodeId: string, from: string, to: string, maxCount = 1000) =>
    client
      .get<HistoricalValue[]>('/history/by-nodeid', {
        params: { nodeId, from, to, maxCount },
      })
      .then(r => r.data),
}
