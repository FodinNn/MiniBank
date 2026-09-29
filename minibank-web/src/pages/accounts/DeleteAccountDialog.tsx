import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Account } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAccountNumber, formatMoney } from '@/lib/format'

interface DeleteAccountDialogProps {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (accountId: number) => Promise<void>
}

export function DeleteAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) setError(null)
    onOpenChange(next)
  }

  const handleConfirm = async () => {
    if (!account) return
    setError(null)
    setDeleting(true)
    try {
      await onConfirm(account.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить счёт.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить счёт?</DialogTitle>
          <DialogDescription>
            {account && (
              <>
                Счёт {formatAccountNumber(account.number)} с балансом{' '}
                {formatMoney(account.balance, account.currency)} будет удалён безвозвратно.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {account && account.balance !== 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            Удалить счёт с ненулевым балансом не получится — сначала выведите средства.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
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
