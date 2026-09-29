import { type FormEvent, useState } from 'react'
import { KeyRound, Loader2, UserRound } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const translations: Record<string, string> = {
  'invalid old password': 'Неверный текущий пароль',
}

function translate(message: string): string {
  return translations[message] ?? message
}

function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const trimmed = fullName.trim()
  const changed = trimmed !== '' && trimmed !== (user?.fullName ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!changed) return

    setSaving(true)
    try {
      await updateProfile(trimmed)
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить профиль.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15">
          <UserRound className="size-4 text-violet-400" />
        </span>
        <h2 className="text-sm font-semibold">Профиль</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="profile-email"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Email
          </Label>
          <Input id="profile-email" value={user?.email ?? ''} disabled className="font-mono" />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="profile-name"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Имя
          </Label>
          <Input
            id="profile-name"
            placeholder="Иван Иванов"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setSuccess(false)
            }}
            aria-invalid={Boolean(error)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Профиль сохранён
          </div>
        )}

        <Button type="submit" disabled={!changed || saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Сохранить
        </Button>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ old?: string; new?: string; repeat?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setSuccess(false)

    const errors: typeof fieldErrors = {}
    if (oldPassword === '') errors.old = 'Введите текущий пароль'
    if (newPassword.length < 6) errors.new = 'Минимум 6 символов'
    if (repeat !== newPassword) errors.repeat = 'Пароли не совпадают'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setRepeat('')
    } catch (err) {
      setServerError(translate(getApiErrorMessage(err, 'Не удалось сменить пароль.')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15">
          <KeyRound className="size-4 text-violet-400" />
        </span>
        <h2 className="text-sm font-semibold">Смена пароля</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="old-password"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Текущий пароль
          </Label>
          <Input
            id="old-password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.old)}
          />
          {fieldErrors.old && <p className="text-xs text-destructive">{fieldErrors.old}</p>}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="new-password"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Новый пароль
          </Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.new)}
          />
          {fieldErrors.new && <p className="text-xs text-destructive">{fieldErrors.new}</p>}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="repeat-password"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Повторите новый пароль
          </Label>
          <Input
            id="repeat-password"
            type="password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            aria-invalid={Boolean(fieldErrors.repeat)}
          />
          {fieldErrors.repeat && <p className="text-xs text-destructive">{fieldErrors.repeat}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Пароль изменён
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Сменить пароль
        </Button>
      </form>
    </Card>
  )
}

export function SettingsPage() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Настройки</h1>
        <p className="mt-2 text-sm text-zinc-500">Профиль и безопасность</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  )
}
