import { api } from './client'
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from './types'

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  me: () => api.get<MeResponse>('/api/auth/me').then((r) => r.data),

  updateProfile: (fullName: string) =>
    api.put<MeResponse>('/api/auth/me', { fullName }).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api
      .post<{ message: string }>('/api/auth/change-password', { oldPassword, newPassword })
      .then((r) => r.data),
}
