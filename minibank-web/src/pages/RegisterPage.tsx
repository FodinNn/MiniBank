import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/errors'

interface FormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setField = (name: keyof FormValues, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    if (values.fullName.trim().length < 2) errors.fullName = 'Укажите имя (минимум 2 символа)'
    if (!values.email.trim()) errors.email = 'Введите email'
    else if (!emailRegex.test(values.email)) errors.email = 'Некорректный email'
    if (values.password.length < 6) errors.password = 'Минимум 6 символов'
    if (values.confirmPassword !== values.password)
      errors.confirmPassword = 'Пароли не совпадают'
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
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Не удалось зарегистрироваться.'))
    } finally {
      setSubmitting(false)
    }
  }

  const fields: Array<{
    name: keyof FormValues
    label: string
    type: string
    placeholder: string
    autoComplete: string
  }> = [
    {
      name: 'fullName',
      label: 'Имя',
      type: 'text',
      placeholder: 'Иван Иванов',
      autoComplete: 'name',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com',
      autoComplete: 'email',
    },
    {
      name: 'password',
      label: 'Пароль',
      type: 'password',
      placeholder: 'Минимум 6 символов',
      autoComplete: 'new-password',
    },
    {
      name: 'confirmPassword',
      label: 'Повторите пароль',
      type: 'password',
      placeholder: '••••••••',
      autoComplete: 'new-password',
    },
  ]

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт, чтобы открыть счёт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {fields.map(({ name, label, type, placeholder, autoComplete }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type={type}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  value={values[name]}
                  onChange={(e) => setField(name, e.target.value)}
                  aria-invalid={Boolean(fieldErrors[name])}
                />
                {fieldErrors[name] && (
                  <p className="text-xs text-destructive">{fieldErrors[name]}</p>
                )}
              </div>
            ))}

            {serverError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Создать аккаунт
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
