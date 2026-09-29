export interface AuthResponse {
  token: string
  email: string
  fullName: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface MeResponse {
  userId: string | null
  email: string | null
  fullName: string | null
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UpdateProfileRequest {
  fullName: string
}

export interface Account {
  id: number
  number: string
  balance: number
  currency: 'RUB' | 'USD' | 'EUR' | string
  createdAt: string
}

export interface CreateAccountRequest {
  currency: string
}

export interface DepositRequest {
  amount: number
}

export interface TransferRequest {
  fromAccountId: number
  toAccountId: number
  amount: number
  description?: string | null
}

export interface TransferResponse {
  transactionId: number
  amount: number
  currency: string
  createdAt: string
}

export interface Transaction {
  id: number
  fromAccountId: number | null
  toAccountId: number | null
  amount: number
  currency: string
  description: string
  createdAt: string
}

export interface TransactionListResponse {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
}

export interface TransactionFilter {
  page?: number
  pageSize?: number
  from?: string
  to?: string
  currency?: string
  type?: string
  minAmount?: number
  maxAmount?: number
}

export interface Rate {
  from: string
  to: string
  rate: number
}

export interface Goal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  /** 0–100 */
  progressPercent: number
  deadline: string
  createdAt: string
  isCompleted: boolean
}

export interface CreateGoalRequest {
  name: string
  targetAmount: number
  /** ISO date (YYYY-MM-DD) */
  deadline: string
}
