import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, RefreshCw, Search } from 'lucide-react'
import { accountsApi, transactionsApi } from '@/api'
import type { Account, Transaction } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/Page'
import { TransactionList } from '@/components/TransactionList'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getApiErrorMessage } from '@/lib/errors'

type DirectionFilter = 'all' | 'in' | 'out'

const currencies = ['ALL', 'RUB', 'USD', 'EUR'] as const

export function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState<DirectionFilter>('all')
  const [currency, setCurrency] = useState<string>('ALL')

  const load = async () => {
    setError(null)
    setTransactions(null)
    try {
      const [txs, accs] = await Promise.all([transactionsApi.list(), accountsApi.list()])
      setTransactions(txs)
      setAccounts(accs)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить историю.'))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const myAccountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts])

  const filtered = useMemo(() => {
    if (!transactions) return []
    const q = search.trim().toLowerCase()

    return transactions.filter((t) => {
      if (q && !t.description.toLowerCase().includes(q) && !String(t.id).includes(q)) {
        return false
      }

      if (direction !== 'all') {
        const isIn = t.toAccountId !== null && myAccountIds.has(t.toAccountId)
        const isOut = t.fromAccountId !== null && myAccountIds.has(t.fromAccountId)
        if (direction === 'in' && !isIn) return false
        if (direction === 'out' && !isOut) return false
      }

      if (currency !== 'ALL' && t.currency !== currency) return false

      return true
    })
  }, [transactions, search, direction, currency, myAccountIds])

  return (
    <Page
      title="История"
      description="Все транзакции по вашим счетам"
      actions={
        <Button
          variant="outline"
          size="icon"
          onClick={() => void load()}
          title="Обновить"
          aria-label="Обновить"
        >
          <RefreshCw className="size-4" />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Фильтры */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Поиск по описанию или ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={direction} onValueChange={(v) => setDirection(v as DirectionFilter)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все операции</SelectItem>
              <SelectItem value="in">Только пополнения</SelectItem>
              <SelectItem value="out">Только списания</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === 'ALL' ? 'Все валюты' : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="p-4">
          {transactions === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Операций пока нет"
              description="Сделайте первый перевод или пополните счёт"
              action={
                <Button asChild>
                  <span>
                    <ArrowLeftRight className="size-4" />
                    Перевести
                  </span>
                </Button>
              }
            />
          ) : (
            <>
              <TransactionList transactions={filtered} accounts={accounts} />
              <p className="mt-3 text-xs text-zinc-500">
                Показано {filtered.length} из {transactions.length}
              </p>
            </>
          )}
        </Card>
      </div>
    </Page>
  )
}
