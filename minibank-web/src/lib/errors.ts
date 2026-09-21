import { isAxiosError } from 'axios'

const messagesByStatus: Record<number, string> = {
  400: 'Некорректный запрос. Проверьте введённые данные.',
  401: 'Неверный email или пароль.',
  403: 'Недостаточно прав.',
  404: 'Не найдено.',
  409: 'Этот email уже зарегистрирован.',
}

export function getApiErrorMessage(error: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.'): string {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data

    if (typeof data === 'string' && data.length > 0 && data.length < 200) {
      const ruMessage = messagesByStatus[error.response?.status ?? 0]
      // Для переводов бэкенд отдаёт человекочитаемые строки ("Insufficient funds" и т.п.)
      const translations: Record<string, string> = {
        'From account not found': 'Счёт списания не найден',
        'To account not found': 'Счёт зачисления не найден',
        'Insufficient funds': 'Недостаточно средств',
        'Cannot transfer to the same account': 'Нельзя переводить на тот же счёт',
        'Invalid amount': 'Некорректная сумма',
        'Currency mismatch': 'Валюты счетов не совпадают',
        'Email is already in use': 'Этот email уже зарегистрирован',
      }
      return translations[data] ?? ruMessage ?? data
    }
    if (data && typeof data === 'object') {
      const maybe = data as { message?: unknown; title?: unknown; errors?: unknown }
      if (typeof maybe.message === 'string') return maybe.message
      if (typeof maybe.title === 'string') return maybe.title
    }
    return messagesByStatus[error.response?.status ?? 0] ?? fallback
  }
  return fallback
}
