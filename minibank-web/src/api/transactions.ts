import { api } from './client'
import type { TransactionFilter, TransactionListResponse } from './types'

export const transactionsApi = {
  list: (filter: TransactionFilter = {}) =>
    api
      .get<TransactionListResponse>('/api/transactions', { params: filter })
      .then((r) => r.data),

  exportCsv: (filter: Pick<TransactionFilter, 'from' | 'to' | 'currency' | 'type'> = {}) =>
    api
      .get<Blob>('/api/transactions/export', {
        params: filter,
        responseType: 'blob',
      })
      .then((r) => r.data),
}
