import type { ComponentType } from 'react'
import { CreditCard, DollarSign, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconType = ComponentType<{ className?: string }>

export interface CurrencyMeta {
  icon: IconType
  /** Круг-подложка иконки */
  circle: string
  /** Цвет иконки */
  text: string
  /** Классы бейджа */
  badge: string
  /** HEX для графиков */
  chart: string
}

/** RUB — синий, USD — зелёный, EUR — оранжевый */
export const currencyMeta: Record<string, CurrencyMeta> = {
  RUB: {
    icon: Wallet,
    circle: 'bg-sky-500/15',
    text: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    chart: '#38bdf8',
  },
  USD: {
    icon: DollarSign,
    circle: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    chart: '#34d399',
  },
  EUR: {
    icon: CreditCard,
    circle: 'bg-orange-500/15',
    text: 'text-orange-400',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    chart: '#fb923c',
  },
}

const fallbackMeta: CurrencyMeta = {
  icon: Wallet,
  circle: 'bg-violet-500/15',
  text: 'text-violet-400',
  badge: 'bg-secondary text-secondary-foreground border-border',
  chart: '#a78bfa',
}

export function getCurrencyMeta(currency: string): CurrencyMeta {
  return currencyMeta[currency] ?? fallbackMeta
}

type CurrencyIconSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<CurrencyIconSize, { circle: string; icon: string }> = {
  sm: { circle: 'size-8', icon: 'size-4' },
  md: { circle: 'size-10', icon: 'size-5' },
  lg: { circle: 'size-12', icon: 'size-6' },
}

/** Иконка валюты в цветном круге. Один размер в одном контексте: sm — таблицы, md — карточки, lg — hero. */
export function CurrencyIcon({
  currency,
  size = 'md',
  className,
}: {
  currency: string
  size?: CurrencyIconSize
  className?: string
}) {
  const meta = getCurrencyMeta(currency)
  const Icon = meta.icon
  const { circle, icon } = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        circle,
        meta.circle,
        className,
      )}
    >
      <Icon className={cn(icon, meta.text)} />
    </div>
  )
}
