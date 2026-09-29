import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Ловит ошибки рендера, чтобы вместо белого экрана показать внятное сообщение
 * с возможностью перезагрузить страницу.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15">
            <AlertTriangle className="size-6 text-destructive" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">Что-то сломалось</h1>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
            </p>
            <p className="mt-2 max-w-md truncate font-mono text-xs text-zinc-600">
              {error.message}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="size-4" />
            Перезагрузить
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
