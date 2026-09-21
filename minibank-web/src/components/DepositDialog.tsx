import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { accountsApi } from '@/api/accounts'
import type { Account } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/errors'

interface DepositDialogProps {
  account: Account
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeposited: (account: Account) => void
}

export function DepositDialog({ account, open, onOpenChange, onDeposited }: DepositDialogProps) {
  const [amount, setAmount] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setAmount('')
    setFieldError(null)
    setServerError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const value = Number(amount.replace(',', '.'))
    if (!amount.trim() || Number.isNaN(value) || value <= 0) {
      setFieldError('Введите сумму больше нуля')
      return
    }

    setSubmitting(true)
    try {
      const updated = await accountsApi.deposit(account.id, value)
      onOpenChange(false)
      onDeposited(updated)
      reset()
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Не удалось пополнить счёт.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Пополнение счёта</DialogTitle>
          <DialogDescription>
            Счёт {account.number} · {account.currency}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Сумма</Label>
            <Input
              id="deposit-amount"
              inputMode="decimal"
              placeholder="1000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          </div>

          {serverError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Пополнить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
