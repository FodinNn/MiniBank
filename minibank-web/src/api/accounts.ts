import { api } from './client'
import type { Account, CreateAccountRequest } from './types'

export const accountsApi = {
  list: () => api.get<Account[]>('/api/accounts').then((r) => r.data),

  get: (id: number) => api.get<Account>(`/api/accounts/${id}`).then((r) => r.data),

  create: (data: CreateAccountRequest) =>
    api.post<Account>('/api/accounts', data).then((r) => r.data),

  deposit: (id: number, amount: number) =>
    api.post<Account>(`/api/accounts/${id}/deposit`, { amount }).then((r) => r.data),
}
