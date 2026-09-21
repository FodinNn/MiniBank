const currencyLocales: Record<string, string> = {
  RUB: 'ru-RU',
  USD: 'en-US',
  EUR: 'de-DE',
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currencyLocales[currency] ?? 'ru-RU', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function formatAmount(amount: number, currency: string): string {
  // Курсам меньше единицы нужно больше точности: 0.0105 вместо 0.01
  const small = Math.abs(amount) < 1 && amount !== 0
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: small ? 4 : 2,
    maximumFractionDigits: small ? 4 : 2,
  }).format(amount)} ${currency}`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatAccountNumber(number: string): string {
  return number.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}
