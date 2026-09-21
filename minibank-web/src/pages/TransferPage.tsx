import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Loader2, ShieldCheck } from 'lucide-react'
import { accountsApi, transactionsApi, transfersApi } from '@/api'
import type { Account, Transaction } from '@/api/types'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getApiErrorMessage } from '@/lib/errors'
import { formatAmount, formatDateTime } from '@/lib/format'

interface FieldErrors {
  fromAccountId?: string
  toAccountId?: string
  amount?: string
}

const steps = [
  {
    title: 'Выберите счёт списания',
    text: 'Средства спишутся с выбранного счёта',
  },
  {
    title: 'Укажите получателя',
    text: 'Перевод возможен только между счетами в одной валюте',
  },
  {
    title: 'Подтвердите перевод',
    text: 'Деньги зачисляются мгновенно',
  },
]

function AccountSelectItem({ account }: { account: Account }) {
  return (
    <SelectItem value={String(account.id)}>
      <span className="inline-flex items-center gap-2">
        {account.currency} · {account.number}
        <span className="font-mono text-xs text-zinc-500">
          {formatAmount(account.balance, account.currency)}
        </span>
      </span>
    </SelectItem>
  )
}

export function TransferPage() {
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [transfers, setTransfers] = useState<Transaction[] | null>(null)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    accountsApi
      .list()
      .then((list) => {
        if (!cancelled) setAccounts(list)
      })
      .catch((err) => {
        if (!cancelled) setServerError(getApiErrorMessage(err, 'Не удалось загрузить счета.'))
      })
    // Для блока «Последние переводы»; ошибка не должна ломать форму
    transactionsApi
      .list()
      .then((txs) => {
        if (!cancelled) setTransfers(txs.filter((t) => t.fromAccountId !== null).slice(0, 4))
      })
      .catch(() => {
        if (!cancelled) setTransfers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const fromAccount = accounts?.find((a) => String(a.id) === fromAccountId) ?? null
  const toAccount = accounts?.find((a) => String(a.id) === toAccountId) ?? null
  const amountNum = Number(amount.replace(',', '.'))
  const amountValid = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0

  // Бэкенд отклоняет переводы между счетами в разных валютах
  const currencyMismatch =
    fromAccount && toAccount ? fromAccount.currency !== toAccount.currency : false
  const insufficient = fromAccount && amountValid ? amountNum > fromAccount.balance : false

  const availableFrom = (accounts ?? []).filter((a) => String(a.id) !== toAccountId)
  const availableTo = (accounts ?? []).filter((a) => String(a.id) !== fromAccountId)

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (!fromAccountId) errors.fromAccountId = 'Выберите счёт списания'
    if (!toAccountId) errors.toAccountId = 'Выберите счёт зачисления'
    if (!amountValid) errors.amount = 'Введите сумму больше нуля'
    return errors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await transfersApi.create({
        fromAccountId: Number(fromAccountId),
        toAccountId: Number(toAccountId),
        amount: amountNum,
        description: description.trim() || null,
      })
      navigate('/history')
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Не удалось выполнить перевод.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page
      title="Перевод"
      description="Между двумя вашими счетами · валюты должны совпадать"
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
        {accounts === null ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-400">
              Для перевода нужно минимум два счёта в одной валюте.
            </p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Перейти к счетам
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Откуда
              </Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {availableFrom.map((a) => (
                    <AccountSelectItem key={a.id} account={a} />
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.fromAccountId && (
                <p className="text-xs text-destructive">{fieldErrors.fromAccountId}</p>
              )}
              {fromAccount && (
                <p className="font-mono text-xs text-zinc-500">
                  Доступно: {formatAmount(fromAccount.balance, fromAccount.currency)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Куда
              </Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {availableTo.map((a) => (
                    <AccountSelectItem key={a.id} account={a} />
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.toAccountId && (
                <p className="text-xs text-destructive">{fieldErrors.toAccountId}</p>
              )}
              {currencyMismatch && (
                <p className="text-xs text-amber-400">Валюты счетов не совпадают</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Сумма
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="1000.00"
                  className="pr-14 text-base font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.amount)}
                />
                {fromAccount && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    {fromAccount.currency}
                  </span>
                )}
              </div>
              {fieldErrors.amount && (
                <p className="text-xs text-destructive">{fieldErrors.amount}</p>
              )}
              {insufficient && !fieldErrors.amount && fromAccount && (
                <p className="text-xs text-amber-400">
                  Недостаточно средств: доступно{' '}
                  {formatAmount(fromAccount.balance, fromAccount.currency)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Описание (необязательно)
              </Label>
              <Input
                id="description"
                placeholder="Например: аренда"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {serverError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Перевести
            </Button>
          </form>
        )}
        </Card>

        {/* Правый sidebar: подсказки и контекст, чтобы страница не была пустой */}
        <aside className="space-y-4">
          {/* Как это работает */}
          <Card>
            <div className="border-b border-border p-5">
              <h3 className="text-sm font-semibold">Как это работает</h3>
            </div>
            <ol className="space-y-4 p-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Последние переводы */}
          <Card>
            <div className="border-b border-border p-5">
              <h3 className="text-sm font-semibold">Последние переводы</h3>
            </div>
            <div className="p-2">
              {transfers === null ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : transfers.length === 0 ? (
                <p className="p-4 text-xs text-zinc-500">
                  Переводов пока нет — они появятся здесь после первой операции.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {transfers.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-secondary/40"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                        <ArrowUpRight className="size-4 text-violet-400" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{t.description || 'Без описания'}</p>
                        <p className="text-xs text-zinc-500">{formatDateTime(t.createdAt)}</p>
                      </div>
                      <span className="font-mono text-sm text-red-400">
                        −{formatAmount(t.amount, t.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Заметка о безопасности */}
          <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="size-4 shrink-0 text-violet-400" />
            <p className="text-xs leading-relaxed text-zinc-500">
              Переводы выполняются в банковской транзакции: средства либо списываются и
              зачисляются целиком, либо остаются на счёте.
            </p>
          </div>
        </aside>
      </div>
    </Page>
  )
}
