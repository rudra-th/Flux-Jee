import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

interface SettingsState {
  settings: UserSettings
  set: (patch: Partial<UserSettings>) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      set: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'jee-arena-settings' },
  ),
)

/** Apply theme/font preferences to the document root */
export function applyTheme(settings: UserSettings): void {
  const root = document.documentElement
  root.dataset.theme = settings.theme
  root.dataset.fontscale = settings.fontScale
  root.style.fontSize =
    settings.fontScale === 'large'
      ? '112.5%'
      : settings.fontScale === 'xlarge'
        ? '125%'
        : '100%'
}
