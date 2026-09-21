import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { ArrowLeft, ArrowLeftRight, Plus, RefreshCw } from 'lucide-react'
import { accountsApi } from '@/api/accounts'
import { transactionsApi } from '@/api/transactions'
import type { Account, Transaction } from '@/api/types'
import { DepositDialog } from '@/components/DepositDialog'
import { CurrencyIcon } from '@/components/CurrencyIcon'
import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/Page'
import { TransactionList } from '@/components/TransactionList'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAccountNumber, formatDate, formatMoney } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/errors'

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depositOpen, setDepositOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    setNotFound(false)
    setTransactions(null)
    try {
      const acc = await accountsApi.get(Number(id))
      setAccount(acc)
      const txs = await transactionsApi.list()
      setTransactions(txs.filter((t) => t.fromAccountId === acc.id || t.toAccountId === acc.id))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
      } else {
        setError(getApiErrorMessage(err, 'Не удалось загрузить счёт.'))
      }
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (notFound) {
    return (
      <Page title="Счёт не найден">
        <p className="text-sm text-zinc-500">
          Возможно, он принадлежит другому пользователю.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
          <ArrowLeft className="size-4" />
          На дашборд
        </Button>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Счёт">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
        <Button variant="outline" className="mt-4" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          Повторить
        </Button>
      </Page>
    )
  }

  return (
    <Page
      title="Счёт"
      description={account ? formatAccountNumber(account.number) : undefined}
      actions={
        <>
          <Button onClick={() => setDepositOpen(true)} disabled={!account}>
            <Plus className="size-4" />
            Пополнить
          </Button>
          <Button variant="outline" asChild disabled={!account}>
            <Link to="/transfer">
              <ArrowLeftRight className="size-4" />
              Перевести
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* Баланс */}
        <Card className="border border-violet-500/30 bg-gradient-to-br from-violet-600/20 via-zinc-900 to-zinc-900 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
          <div className="flex items-start justify-between gap-4 p-6 md:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Баланс</p>
              {account ? (
                <h2 className="mt-2 text-5xl font-bold font-mono tracking-tight text-white">
                  {formatMoney(account.balance, account.currency)}
                </h2>
              ) : (
                <Skeleton className="mt-3 h-12 w-56" />
              )}
              {account && (
                <p className="mt-3 text-xs text-zinc-500">
                  Открыт {formatDate(account.createdAt)}
                </p>
              )}
            </div>
            {account && <CurrencyIcon currency={account.currency} size="lg" />}
          </div>
        </Card>

        {/* История по счёту */}
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            История по счёту
          </p>
          {transactions === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Операций по счёту пока нет"
              description="Пополните счёт — первая транзакция появится здесь"
              action={
                <Button onClick={() => setDepositOpen(true)} disabled={!account}>
                  <Plus className="size-4" />
                  Пополнить счёт
                </Button>
              }
            />
          ) : (
            <TransactionList transactions={transactions} accounts={account ? [account] : []} />
          )}
        </section>
      </div>

      {account && (
        <DepositDialog
          account={account}
          open={depositOpen}
          onOpenChange={setDepositOpen}
          onDeposited={(updated) => setAccount(updated)}
        />
      )}
    </Page>
  )
}
