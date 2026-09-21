import { api } from './client'
import type { Transaction } from './types'

export const transactionsApi = {
  list: () => api.get<Transaction[]>('/api/transactions').then((r) => r.data),
}
