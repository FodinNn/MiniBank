import { ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Account, Transaction } from '@/api/types'
import { formatAmount, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

type Direction = 'in' | 'out' | 'internal'

const directionMeta: Record<
  Direction,
  { icon: typeof ArrowDownLeft; amountClass: string; sign: string }
> = {
  in: { icon: ArrowDownLeft, amountClass: 'text-emerald-400', sign: '+' },
  out: { icon: ArrowUpRight, amountClass: 'text-red-400', sign: '−' },
  internal: { icon: ArrowRight, amountClass: 'text-muted-foreground', sign: '' },
}

function getDirection(t: Transaction, myAccountIds: Set<number>): Direction {
  const fromMine = t.fromAccountId !== null && myAccountIds.has(t.fromAccountId)
  const toMine = t.toAccountId !== null && myAccountIds.has(t.toAccountId)

  if (fromMine && toMine) return 'internal'
  if (toMine) return 'in'
  if (fromMine) return 'out'
  return 'internal'
}

function accountLabel(id: number | null, accountsById: Map<number, Account>): string {
  if (id === null) return '—'
  const account = accountsById.get(id)
  return account ? account.number : `#${id}`
}

interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  emptyMessage?: string
}

export function TransactionList({
  transactions,
  accounts,
  emptyMessage = 'Операций пока нет',
}: TransactionListProps) {
  const myAccountIds = new Set(accounts.map((a) => a.id))
  const accountsById = new Map(accounts.map((a) => [a.id, a]))

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Дата</th>
            <th className="px-4 py-3 font-medium">Описание</th>
            <th className="px-4 py-3 font-medium">Счета</th>
            <th className="px-4 py-3 text-right font-medium">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const direction = getDirection(t, myAccountIds)
            const { icon: Icon, amountClass, sign } = directionMeta[direction]

            return (
              <tr
                key={t.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDateTime(t.createdAt)}
                </td>
                <td className="max-w-[240px] truncate px-4 py-3">
                  {t.description || 'Без описания'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="size-3.5" />
                    {accountLabel(t.fromAccountId, accountsById)}
                    <span className="text-border">→</span>
                    {accountLabel(t.toAccountId, accountsById)}
                  </span>
                </td>
                <td className={cn('whitespace-nowrap px-4 py-3 text-right font-medium', amountClass)}>
                  {sign}
                  {formatAmount(t.amount, t.currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
