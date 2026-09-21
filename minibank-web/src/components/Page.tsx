import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Обёртка страницы: fade-in анимация + единая типографика заголовков.
 */
export function Page({ title, description, actions, className, children }: PageProps) {
  return (
    <div className={cn('animate-in fade-in duration-300', className)}>
      {(title || actions) && (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && <h1 className="text-4xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="mt-2 text-sm text-zinc-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
