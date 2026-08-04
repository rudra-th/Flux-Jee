import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { Icon, type IconName } from '@/components/ui'
import { useUIStore } from '@/stores/uiStore'

export interface NavItem {
  label: string
  path: string
  icon: IconName
  badge?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Home', path: '/', icon: 'home' },
      { label: 'Analytics', path: '/analytics', icon: 'analytics' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Full Test', path: '/test/full', icon: 'full' },
      { label: 'Test Builder', path: '/test/custom', icon: 'custom' },
      { label: 'Chapter Tests', path: '/test/chapter', icon: 'chapter' },
      { label: 'PYQ Papers', path: '/practice/pyq', icon: 'pyq' },
      { label: 'Mixed Practice', path: '/practice/mixed', icon: 'mixed' },
      { label: 'Daily Challenge', path: '/practice/daily', icon: 'daily', badge: 'New' },
      { label: 'Adaptive Mode', path: '/practice/adaptive', icon: 'adaptive' },
      { label: 'Speed Test', path: '/practice/speed', icon: 'speed' },
      { label: 'Marathon', path: '/practice/marathon', icon: 'marathon' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { label: 'Question Bank', path: '/question-bank', icon: 'question' },
      { label: 'Flashcards', path: '/flashcards', icon: 'flashcard' },
      { label: 'Formula Revision', path: '/formulas', icon: 'formula' },
      { label: 'Mistake Notebook', path: '/mistakes', icon: 'mistake' },
      { label: 'Bookmarks', path: '/bookmarks', icon: 'bookmark' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Leaderboard', path: '/leaderboard', icon: 'leaderboard' },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <button
        onClick={() => {
          navigate('/')
          onNavigate?.()
        }}
        className="focus-ring flex items-center gap-2.5 px-5 py-5 text-left"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/30">
          <Icon name="target" size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-text">JEE Arena</p>
          <p className="text-[10px] font-medium text-text3">The Closest Experience to the Real JEE</p>
        </div>
      </button>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-text3">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text2 hover:bg-surface2 hover:text-text',
                    )
                  }
                >
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text2 transition-colors hover:bg-surface2 hover:text-text"
        >
          <Icon name="settings" size={17} />
          Settings
        </NavLink>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebar } = useUIStore()
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebar(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-2xl lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.22 }}
            >
              <SidebarContent onNavigate={() => setSidebar(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
