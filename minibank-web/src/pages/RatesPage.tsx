import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { ratesApi } from '@/api'
import type { Rate } from '@/api/types'
import { CurrencyIcon } from '@/components/CurrencyIcon'
import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/errors'

export function RatesPage() {
  const [rates, setRates] = useState<Rate[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setRates(null)
    try {
      setRates(await ratesApi.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить курсы валют.'))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <Page
      title="Курсы валют"
      description="Внутренние курсы банка"
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          Обновить
        </Button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="p-2">
        {rates === null ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Из</th>
                  <th className="px-4 py-3">В</th>
                  <th className="px-4 py-3 text-right">Курс</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr
                    key={`${r.from}-${r.to}`}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-3">
                        <CurrencyIcon currency={r.from} size="sm" />
                        <span className="font-medium">{r.from}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-3">
                        <CurrencyIcon currency={r.to} size="sm" />
                        <span className="font-medium">{r.to}</span>
                        <ArrowRight className="hidden size-3.5 text-zinc-600" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {formatAmount(r.rate, r.to)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
