import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { ThemeMenu } from './ThemeMenu'

export function TopBar() {
  const { toggleSidebar } = useUIStore()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md">
      <button
        onClick={toggleSidebar}
        className="focus-ring rounded-lg p-2 text-text2 transition-colors hover:bg-surface2 hover:text-text lg:hidden"
        aria-label="Toggle menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-text3">Good to see you,</span>
        <span className="font-semibold text-text">{settings.userName}</span>
        <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">
          {settings.examTarget === 'jee-main' ? 'JEE Main' : 'JEE Advanced'}
        </span>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => navigate('/search')}
        className="focus-ring flex items-center gap-2 rounded-lg border border-border bg-surface2 px-3 py-1.5 text-sm text-text3 transition-colors hover:border-border2 hover:text-text2"
      >
        <Icon name="search" size={16} />
        <span className="hidden sm:inline">Search questions, topics...</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 text-[10px] text-text3 sm:inline">
          /
        </kbd>
      </button>

      <ThemeMenu />

      <button
        onClick={() => navigate('/search')}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text2 transition-colors hover:bg-surface2 hover:text-text sm:hidden"
        aria-label="Search"
      >
        <Icon name="search" size={18} />
      </button>
    </header>
  )
}
