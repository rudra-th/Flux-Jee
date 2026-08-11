import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Icon } from '@/components/ui'

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Catches render errors anywhere below it and shows a recoverable
 * fallback instead of a blank screen. The boundary resets when the
 * error is dismissed so the user can retry without a full reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reset = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10">
            <Icon name="alert" size={26} className="text-danger" />
          </div>
          <h1 className="mt-5 text-lg font-bold text-text">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-text2">
            The app hit an unexpected error. Your progress is saved on this device — nothing has
            been lost.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={this.reset}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary2"
            >
              <Icon name="refresh" size={16} />
              Try again
            </button>
            <a
              href="/"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-border2 px-4 text-sm font-semibold text-text transition-colors hover:bg-surface2"
            >
              <Icon name="home" size={16} />
              Go home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
