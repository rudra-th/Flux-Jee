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
  /** Current onboarding step (0-4) for resume capability */
  onboardingStep: number
  /** Preferred subjects for personalization */
  preferredSubjects: string[]
  offlineMode: boolean
}

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'main',
  theme: 'dark',
  fontScale: 'normal',
  soundEnabled: true,
  showTimer: true,
  autoSubmit: true,
  dailyGoal: 30,
  userName: '',
  examTarget: 'jee-main',
  targetYear: 2027,
  reducedMotion: false,
  onboarded: false,
  onboardingStep: 0,
  preferredSubjects: [],
  offlineMode: true,
}
