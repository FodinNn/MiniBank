import { type FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { CreateGoalRequest } from '@/api/types'
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

interface CreateGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateGoalRequest) => Promise<void>
}

export function CreateGoalDialog({ open, onOpenChange, onSubmit }: CreateGoalDialogProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; targetAmount?: string; deadline?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setTargetAmount('')
    setDeadline('')
    setFieldErrors({})
    setServerError(null)
  }

  const targetNum = Number(targetAmount.replace(',', '.'))
  const targetValid = targetAmount.trim() !== '' && !Number.isNaN(targetNum) && targetNum > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const errors: typeof fieldErrors = {}
    if (name.trim() === '') errors.name = 'Введите название'
    if (!targetValid) errors.targetAmount = 'Введите сумму больше нуля'
    if (deadline === '') errors.deadline = 'Выберите дату'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), targetAmount: targetNum, deadline })
      reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Не удалось создать цель.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новая цель</DialogTitle>
          <DialogDescription>Копилка на конкретную сумму с дедлайном</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="goal-name"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Название
            </Label>
            <Input
              id="goal-name"
              placeholder="Например: Новый ноутбук"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="goal-target"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Целевая сумма
            </Label>
            <Input
              id="goal-target"
              inputMode="decimal"
              placeholder="100000"
              className="font-mono"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              aria-invalid={Boolean(fieldErrors.targetAmount)}
            />
            {fieldErrors.targetAmount && (
              <p className="text-xs text-destructive">{fieldErrors.targetAmount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="goal-deadline"
              className="text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Дедлайн
            </Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={Boolean(fieldErrors.deadline)}
            />
            {fieldErrors.deadline && (
              <p className="text-xs text-destructive">{fieldErrors.deadline}</p>
            )}
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
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
