import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Flag, Loader2, Plus, Target } from 'lucide-react'
import { goalsApi } from '@/api'
import type { CreateGoalRequest, Goal } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Page } from '@/components/Page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate, formatMoney } from '@/lib/format'
import { AddToGoalDialog } from './goals/AddToGoalDialog'
import { CreateGoalDialog } from './goals/CreateGoalDialog'
import { DeleteGoalDialog } from './goals/DeleteGoalDialog'

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyGoalId, setBusyGoalId] = useState<number | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [addGoal, setAddGoal] = useState<Goal | null>(null)
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setGoals(null)
    try {
      setGoals(await goalsApi.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить цели.'))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (data: CreateGoalRequest) => {
    const created = await goalsApi.create(data)
    setGoals((prev) => [created, ...(prev ?? [])])
  }

  const handleAdd = async (goalId: number, amount: number) => {
    setBusyGoalId(goalId)
    try {
      const updated = await goalsApi.add(goalId, amount)
      setGoals((prev) => prev?.map((g) => (g.id === updated.id ? updated : g)) ?? null)
    } finally {
      setBusyGoalId(null)
    }
  }

  const handleDelete = async (goalId: number) => {
    setBusyGoalId(goalId)
    try {
      await goalsApi.remove(goalId)
      setGoals((prev) => prev?.filter((g) => g.id !== goalId) ?? null)
    } finally {
      setBusyGoalId(null)
    }
  }

  // --- Агрегаты для hero-карточки ---
  const list = goals ?? []
  const totalCurrent = list.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = list.reduce((s, g) => s + g.targetAmount, 0)
  const totalPercent = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0
  const completedCount = list.filter((g) => g.isCompleted).length

  return (
    <Page
      title="Цели"
      description="Копилки на конкретные суммы с дедлайнами"
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Создать цель
        </Button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {goals === null ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Пока нет целей. Создайте первую!"
          description="Откладывайте деньги на ноутбук, отпуск или подушку безопасности — прогресс будет виден здесь."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Создать цель
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Hero: общий прогресс по всем целям */}
          <Card className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Общий прогресс
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-tight">
                  {formatMoney(totalCurrent, 'RUB')}
                  <span className="text-lg font-medium text-zinc-500">
                    {' '}
                    / {formatMoney(totalTarget, 'RUB')}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {list.length} {list.length === 1 ? 'цель' : completedCount === list.length ? 'целей' : `целей · ${completedCount} достигнут${completedCount === 1 ? 'а' : 'о'}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-bold tracking-tight text-violet-400">
                  {totalPercent.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="relative mt-5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={
                  totalPercent >= 100
                    ? 'h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500'
                    : 'h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-500 transition-all duration-500'
                }
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </Card>

          {/* Grid карточек целей */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                busy={busyGoalId === goal.id}
                onAdd={() => setAddGoal(goal)}
                onDelete={() => setDeleteGoal(goal)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateGoalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => handleCreate(data)}
      />
      <AddToGoalDialog
        goal={addGoal}
        open={addGoal !== null}
        onOpenChange={(o) => !o && setAddGoal(null)}
        onSubmit={handleAdd}
      />
      <DeleteGoalDialog
        goal={deleteGoal}
        open={deleteGoal !== null}
        onOpenChange={(o) => !o && setDeleteGoal(null)}
        onConfirm={handleDelete}
      />
    </Page>
  )
}

interface GoalCardProps {
  goal: Goal
  busy: boolean
  onAdd: () => void
  onDelete: () => void
}

function GoalCard({ goal, busy, onAdd, onDelete }: GoalCardProps) {
  const percent = Math.min(100, goal.progressPercent)
  const completed = goal.isCompleted

  return (
    <Card className={completed ? 'flex flex-col border-emerald-500/30' : 'flex flex-col'}>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={
                completed
                  ? 'flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15'
                  : 'flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15'
              }
            >
              <Flag className={completed ? 'size-4 text-emerald-400' : 'size-4 text-violet-400'} />
            </span>
            <h3 className="font-semibold leading-tight">{goal.name}</h3>
          </div>
          {completed && (
            <Badge className="border-transparent bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="size-3" />
              Достигнута
            </Badge>
          )}
        </div>

        <p className="mt-4 font-mono text-xl font-semibold tracking-tight">
          {formatMoney(goal.currentAmount, 'RUB')}
          <span className="text-sm font-medium text-zinc-500">
            {' '}
            / {formatMoney(goal.targetAmount, 'RUB')}
          </span>
        </p>

        {/* Прогресс-бар: градиент violet→emerald при 100% */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={
              completed
                ? 'h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500'
                : 'h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-500 transition-all duration-500'
            }
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 font-mono text-xs text-zinc-500">{percent.toFixed(0)}%</p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <CalendarDays className="size-3.5" />
          до {formatDate(goal.deadline)}
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <Button
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={onAdd}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Пополнить
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={onDelete}
        >
          Удалить
        </Button>
      </div>
    </Card>
  )
}
