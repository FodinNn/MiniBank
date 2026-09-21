import { api } from './client'
import type { Rate } from './types'

export const ratesApi = {
  list: () => api.get<Rate[]>('/api/rate').then((r) => r.data),
}
