export type ThemeId = 'dark' | 'light' | 'oled' | 'highcontrast'

export type FontScale = 'normal' | 'large' | 'xlarge'

export interface UserSettings {
  id: 'main'
  theme: ThemeId
  fontScale: FontScale
  soundEnabled: boolean
  showTimer: boolean
  autoSubmit: boolean
  dailyGoal: number
  userName: string
  examTarget: 'jee-main' | 'jee-advanced'
  targetYear: number
  reducedMotion: boolean
  /** Whether first-time onboarding shown */
  onboarded: boolean
  offlineMode: boolean
  /**
   * Optional user-supplied Gemini API key. Stored ONLY in this browser
   * (localStorage via the settings store) and sent to the AI endpoint as a
   * per-request header. When empty, the server's own key is used.
   */
  geminiApiKey?: string
}

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'main',
  theme: 'dark',
  fontScale: 'normal',
  soundEnabled: true,
  showTimer: true,
  autoSubmit: true,
  dailyGoal: 30,
  userName: 'Aspirant',
  examTarget: 'jee-main',
  targetYear: new Date().getFullYear(),
  reducedMotion: false,
  onboarded: false,
  offlineMode: true,
}
