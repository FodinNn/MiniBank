import { getCurrencyMeta } from '@/components/CurrencyIcon'
import { cn } from '@/lib/utils'

export function CurrencyBadge({ currency, className }: { currency: string; className?: string }) {
  const { badge } = getCurrencyMeta(currency)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold tracking-wide',
        badge,
        className,
      )}
    >
      {currency}
    </span>
  )
}
