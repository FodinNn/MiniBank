import { api } from './client'
import type { CreateGoalRequest, Goal } from './types'

export const goalsApi = {
  list: () => api.get<Goal[]>('/api/goals').then((r) => r.data),

  get: (id: number) => api.get<Goal>(`/api/goals/${id}`).then((r) => r.data),

  create: (data: CreateGoalRequest) =>
    api.post<Goal>('/api/goals', data).then((r) => r.data),

  add: (id: number, amount: number) =>
    api.post<Goal>(`/api/goals/${id}/add`, { amount }).then((r) => r.data),

  remove: (id: number) => api.delete<void>(`/api/goals/${id}`).then((r) => r.data),
}
