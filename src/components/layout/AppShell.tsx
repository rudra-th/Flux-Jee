import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { Toaster, Icon } from '@/components/ui'

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isTestRunner = location.pathname.startsWith('/run/')

  if (isTestRunner) {
    return (
      <>
        <div className="min-h-screen">{children}</div>
        <Toaster />
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-border px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-text3">
            <span>JEE Arena · The Closest Experience to the Real JEE · Offline-first</span>
            <a
              href="https://github.com/rudra-th"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-text2 transition-colors hover:text-text"
            >
              <Icon name="github" size={13} />
              Made by Rudra
            </a>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-text2">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
