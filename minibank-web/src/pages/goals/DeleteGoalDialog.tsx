import { useState } from 'react'
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

interface DeleteGoalDialogProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (goalId: number) => Promise<void>
}

export function DeleteGoalDialog({ goal, open, onOpenChange, onConfirm }: DeleteGoalDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Сбрасываем ошибку при закрытии, чтобы при повторном открытии диалог был чистым
  const handleOpenChange = (next: boolean) => {
    if (!next) setError(null)
    onOpenChange(next)
  }

  const handleConfirm = async () => {
    if (!goal) return
    setError(null)
    setDeleting(true)
    try {
      await onConfirm(goal.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить цель.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить цель?</DialogTitle>
          <DialogDescription>
            {goal
              ? `Цель «${goal.name}» и её прогресс будут удалены безвозвратно.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={deleting}>
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
