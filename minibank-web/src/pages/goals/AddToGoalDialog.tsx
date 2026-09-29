import { type FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Goal } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatAmount } from '@/lib/format'

interface AddToGoalDialogProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (goalId: number, amount: number) => Promise<void>
}

const presets = [1000, 5000, 10000, 50000]

export function AddToGoalDialog({ goal, open, onOpenChange, onSubmit }: AddToGoalDialogProps) {
  const [amount, setAmount] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Сбрасываем форму при закрытии, чтобы при повторном открытии она была чистой
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmount('')
      setFieldError(null)
      setServerError(null)
    }
    onOpenChange(next)
  }

  const amountNum = Number(amount.replace(',', '.'))
  const amountValid = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!goal) return

    if (!amountValid) {
      setFieldError('Введите сумму больше нуля')
      return
    }
    setFieldError(null)

    setSubmitting(true)
    try {
      await onSubmit(goal.id, amountNum)
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Не удалось пополнить цель.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Пополнить цель</DialogTitle>
          <DialogDescription>
            {goal ? `«${goal.name}» · накоплено ${formatAmount(goal.currentAmount, 'RUB')} из ${formatAmount(goal.targetAmount, 'RUB')}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="goal-amount"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Сумма
            </Label>
            <Input
              id="goal-amount"
              inputMode="decimal"
              placeholder="1000.00"
              className="font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(fieldError)}
            />
            {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                className="font-mono"
                onClick={() => {
                  setAmount(String(p))
                  setFieldError(null)
                }}
              >
                +{new Intl.NumberFormat('ru-RU').format(p)}
              </Button>
            ))}
          </div>

          {serverError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
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
