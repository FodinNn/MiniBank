import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, Plus, Wallet } from 'lucide-react'
import { accountsApi, ratesApi, transactionsApi } from '@/api'
import type { Account, Rate, Transaction } from '@/api/types'
import { CreateAccountDialog } from '@/components/CreateAccountDialog'
import { CurrencyIcon, getCurrencyMeta } from '@/components/CurrencyIcon'
import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/Page'
import { TransactionList } from '@/components/TransactionList'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/errors'
import { formatAccountNumber, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const DAY_MS = 86_400_000

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d)
}

/**
 * Восстанавливает динамику общего баланса (в рублях) назад во времени:
 * текущие балансы минус эффекты транзакций за окно.
 */
function buildBalanceSeries(
  currentTotalRub: number,
  transactions: Transaction[],
  myAccountIds: Set<number>,
  rubRate: Record<string, number>,
  days: number,
): Array<{ date: string; total: number }> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Дельты по дням: насколько изменился баланс за день (вперёд во времени)
  const deltaByDay = new Map<string, number>()
  for (const t of transactions) {
    const created = new Date(t.createdAt)
    if (created.getTime() < startOfToday.getTime() - (days - 1) * DAY_MS) continue

    const fromMine = t.fromAccountId !== null && myAccountIds.has(t.fromAccountId)
    const toMine = t.toAccountId !== null && myAccountIds.has(t.toAccountId)
    if (fromMine && toMine) continue // внутренний перевод — не влияет на общий баланс

    const rub = t.amount * (rubRate[t.currency] ?? 0)
    const delta = toMine ? rub : fromMine ? -rub : 0
    if (delta === 0) continue

    const key = localDayKey(created)
    deltaByDay.set(key, (deltaByDay.get(key) ?? 0) + delta)
  }

  const points: Array<{ date: string; total: number }> = []
  let balance = currentTotalRub

  for (let i = 0; i < days; i++) {
    const d = new Date(startOfToday.getTime() - i * DAY_MS)
    points.unshift({ date: dayLabel(d), total: Math.max(0, Math.round(balance * 100) / 100) })
    balance -= deltaByDay.get(localDayKey(d)) ?? 0
  }

  return points
}

const compactRub = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const tooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: 12,
  fontSize: 13,
  boxShadow: '0 0 20px rgba(124,58,237,0.15)',
}

export function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [rates, setRates] = useState<Rate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [range, setRange] = useState<7 | 30>(7)

  const load = async () => {
    setError(null)
    setAccounts(null)
    setTransactions(null)
    try {
      const [acc, tx, rt] = await Promise.all([
        accountsApi.list(),
        transactionsApi.list(),
        ratesApi.list().catch(() => [] as Rate[]),
      ])
      setAccounts(acc)
      setTransactions(tx)
      setRates(rt)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить данные.'))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const rubRate = useMemo(() => {
    const map: Record<string, number> = { RUB: 1 }
    for (const r of rates ?? []) {
      if (r.to === 'RUB') map[r.from] = r.rate
    }
    return map
  }, [rates])

  const totalRub = useMemo(
    () =>
      (accounts ?? []).reduce((sum, a) => sum + a.balance * (rubRate[a.currency] ?? 0), 0),
    [accounts, rubRate],
  )

  const balanceSeries = useMemo(() => {
    if (!accounts) return []
    const ids = new Set(accounts.map((a) => a.id))
    return buildBalanceSeries(totalRub, transactions ?? [], ids, rubRate, range)
  }, [accounts, transactions, totalRub, rubRate, range])

  const pieData = useMemo(() => {
    if (!accounts) return []
    const totals = new Map<string, number>()
    for (const a of accounts) {
      totals.set(a.currency, (totals.get(a.currency) ?? 0) + a.balance * (rubRate[a.currency] ?? 0))
    }
    const sum = [...totals.values()].reduce((s, v) => s + v, 0)
    return [...totals.entries()].map(([currency, value]) => ({
      currency,
      value,
      fill: getCurrencyMeta(currency).chart,
      percent: sum > 0 ? Math.round((value / sum) * 100) : 0,
    }))
  }, [accounts, rubRate])

  if (error) {
    return (
      <Page title="Дашборд">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          Повторить
        </Button>
      </Page>
    )
  }

  return (
    <Page
      title="Дашборд"
      description="Обзор ваших счетов и операций"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Создать счёт
        </Button>
      }
    >
      <div className="space-y-8">
        {/* ── Hero: общий баланс ─────────────────────────────── */}
        <Card className="border border-violet-500/30 bg-gradient-to-br from-violet-600/20 via-zinc-900 to-zinc-900 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Общий баланс
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-3">
              {accounts ? (
                <h2 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-5xl font-bold font-mono tracking-tight text-transparent">
                  {formatMoney(totalRub, 'RUB')}
                </h2>
              ) : (
                <Skeleton className="h-12 w-64" />
              )}
              {accounts && accounts.length > 0 && (
                <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
                  <Wallet className="size-3.5" />
                  {accounts.length}{' '}
                  {accounts.length === 1 ? 'счёт' : accounts.length < 5 ? 'счёта' : 'счетов'}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* ── Графики ────────────────────────────────────────── */}
        <div className="grid gap-4 xl:grid-cols-5">
          {/* Area chart: динамика баланса */}
          <Card className="xl:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h3 className="text-sm font-semibold">Динамика баланса</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Оценка по истории операций, в рублях</p>
              </div>
              <div className="flex rounded-xl border border-border p-0.5">
                {([7, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRange(d)}
                    className={cn(
                      'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                      range === d
                        ? 'bg-violet-600/15 text-violet-400 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
                        : 'text-zinc-500 hover:text-zinc-300',
                    )}
                  >
                    {d} дней
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {accounts === null || transactions === null ? (
                <Skeleton className="h-56 w-full" />
              ) : transactions.length === 0 ? (
                <div className="flex h-56 items-center justify-center">
                  <p className="text-sm text-zinc-500">График появится после первых операций.</p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#52525b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={32}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tickFormatter={(v: number) => compactRub.format(v)}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatMoney(Number(value ?? 0), 'RUB'), 'Баланс']}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#balanceFill)"
                        activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#0a0a0a', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>

          {/* Pie chart: распределение по валютам */}
          <Card className="xl:col-span-2">
            <div className="border-b border-border p-5">
              <h3 className="text-sm font-semibold">По валютам</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Распределение средств</p>
            </div>
            <div className="p-5">
              {accounts === null ? (
                <Skeleton className="h-56 w-full" />
              ) : pieData.length === 0 || totalRub <= 0 ? (
                <div className="flex h-56 items-center justify-center">
                  <EmptyState
                    title="Нет средств для распределения"
                    description="Пополните счёт."
                    className="border-none py-0"
                  />
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-4 sm:flex-row">
                  <div className="h-40 w-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="currency"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={4}
                          cornerRadius={6}
                          stroke="none"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.currency} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => formatMoney(Number(value ?? 0), 'RUB')}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2.5 sm:max-w-40">
                    {pieData.map((p) => (
                      <div key={p.currency} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm text-zinc-300">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: p.fill }}
                          />
                          {p.currency}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">{p.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Карточки счетов ────────────────────────────────── */}
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Мои счета</p>
          {accounts === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Счетов пока нет"
              description="Откройте первый счёт, чтобы хранить средства и делать переводы"
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Открыть счёт
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Link key={account.id} to={`/accounts/${account.id}`} className="group">
                  <Card className="h-full p-5 transition-all group-hover:border-violet-500/50">
                    <div className="flex items-start justify-between gap-3">
                      <CurrencyIcon currency={account.currency} />
                      <ArrowUpRight className="size-4 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {account.currency}
                    </p>
                    <p className="mt-1 text-2xl font-bold font-mono tracking-tight">
                      {formatMoney(account.balance, account.currency)}
                    </p>
                    <p className="mt-3 font-mono text-xs text-zinc-500">
                      {formatAccountNumber(account.number)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Последние операции ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Последние операции
            </p>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/history">Вся история</Link>
            </Button>
          </div>
          {transactions === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Операций пока нет"
              description="Пополните счёт или сделайте перевод — история появится здесь"
            />
          ) : (
            <TransactionList transactions={transactions.slice(0, 6)} accounts={accounts ?? []} />
          )}
        </section>
      </div>

      <CreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />
    </Page>
  )
}
