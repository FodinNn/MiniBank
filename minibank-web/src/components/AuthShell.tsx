import type { ReactNode } from 'react'
import { Landmark } from 'lucide-react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh animate-in items-center justify-center overflow-hidden bg-background p-4 fade-in duration-300">
      {/* Фоновое свечение в стиле Linear */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[160px]"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Landmark className="size-5 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">MiniBank</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ваши счета, переводы и курсы валют
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
