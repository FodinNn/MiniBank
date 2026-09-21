import { api } from './client'
import type { TransferRequest } from './types'

export const transfersApi = {
  create: (data: TransferRequest) => api.post('/api/transfers', data).then((r) => r.data),
}
