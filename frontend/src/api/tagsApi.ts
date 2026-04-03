import client from './client'
import type { Tag, TagValue } from '../types'

export const tagsApi = {
  getAll: () =>
    client.get<Tag[]>('/tags').then(r => r.data),

  getById: (id: number) =>
    client.get<Tag>(`/tags/${id}`).then(r => r.data),

  create: (tag: Omit<Tag, 'id' | 'createdAt'>) =>
    client.post<{ id: number }>('/tags', tag).then(r => r.data),

  update: (id: number, tag: Partial<Tag>) =>
    client.put(`/tags/${id}`, tag),

  setActive: (id: number, value: boolean) =>
    client.patch(`/tags/${id}/active?value=${value}`),

  getCurrentValue: (id: number) =>
    client.get<TagValue>(`/tags/${id}/value`).then(r => r.data),

  getAllCurrentValues: () =>
    client.get<TagValue[]>('/tags/values').then(r => r.data),
}
