import { useNavigate } from 'react-router-dom'
import { Button, Icon } from '@/components/ui'
import { AppShell } from '@/components/layout/AppShell'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-7xl font-bold tracking-tight text-primary/20 sm:text-8xl">
          404
        </p>
        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface2">
          <Icon name="search" size={30} className="text-text3" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-text">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-text2">
          This page doesn&apos;t exist or has moved. Your progress is safe — let&apos;s get you
          back to practice.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/dashboard')} icon="home">
            Go to Dashboard
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/')} iconRight="arrow-right">
            Back to Home
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
