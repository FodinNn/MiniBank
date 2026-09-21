import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  Percent,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/transfer', label: 'Перевод', icon: ArrowLeftRight, end: false },
  { to: '/history', label: 'История', icon: History, end: false },
  { to: '/rates', label: 'Курсы валют', icon: Percent, end: false },
]

export function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = (user?.fullName ?? user?.email ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-svh bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-zinc-950/60 md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <Landmark className="size-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">MiniBank</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-r-xl border-l-2 px-3 py-2 text-sm transition-all',
                  isActive
                    ? 'border-l-violet-500 bg-violet-600/10 font-medium text-violet-400'
                    : 'border-l-transparent text-zinc-400 hover:bg-secondary/60 hover:text-zinc-100',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <Avatar className="size-8 border-violet-500/30 bg-violet-500/15">
              <AvatarFallback className="text-xs font-medium text-violet-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs text-zinc-500">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-zinc-500 hover:text-zinc-100"
              onClick={handleLogout}
              title="Выйти"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-h-svh flex-col md:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <Landmark className="size-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">MiniBank</span>
          </div>

          <p className="hidden text-sm text-zinc-500 md:block">
            Добро пожаловать,{' '}
            <span className="font-medium text-zinc-100">
              {user?.fullName ?? user?.email}
            </span>
          </p>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Выйти
          </Button>
        </header>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-xl px-3 py-1.5 text-sm',
                  isActive ? 'bg-violet-600/10 text-violet-400' : 'text-zinc-400',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
