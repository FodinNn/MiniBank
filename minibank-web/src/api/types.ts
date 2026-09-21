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

export interface Rate {
  from: string
  to: string
  rate: number
}
