import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { DataBootstrap } from '@/components/layout/DataBootstrap'
import { useSettingsStore, applyTheme } from '@/stores/settingsStore'
import LandingPage from '@/pages/LandingPage'
import HomePage from '@/pages/HomePage'
import TestBuilder from '@/pages/TestBuilder'
import PracticePage from '@/pages/PracticePage'
import PracticeModeRoute from '@/pages/PracticeModeRoute'
import TestRunner from '@/pages/TestRunner'
import TestResult from '@/pages/TestResult'
import AnalyticsPage from '@/pages/AnalyticsPage'
import MistakesPage from '@/pages/MistakesPage'
import BookmarksPage from '@/pages/BookmarksPage'
import FlashcardsPage from '@/pages/FlashcardsPage'
import FormulasPage from '@/pages/FormulasPage'
import SearchPage from '@/pages/SearchPage'
import SettingsPage from '@/pages/SettingsPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import MockTestSeries from '@/pages/MockTestSeries'
import MockTestDetail from '@/pages/MockTestDetail'
import PyqPaperList from '@/pages/PyqPaperList'
import { warmSearchIndex } from '@/engines/search/engine'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function DashboardRoute() {
  const onboarded = useSettingsStore((s) => s.settings.onboarded)
  if (!onboarded) return <OnboardingWizard />
  return <AppShell><HomePage /></AppShell>
}

export default function App() {
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    applyTheme(settings)
  }, [settings])

  useEffect(() => {
    warmSearchIndex()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <DataBootstrap>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/mock-tests" element={<AppShell><MockTestSeries /></AppShell>} />
            <Route path="/mock-tests/:series" element={<AppShell><MockTestSeries /></AppShell>} />
            <Route path="/mock-tests/:series/:testId" element={<AppShell><MockTestDetail /></AppShell>} />
            <Route path="/test" element={<AppShell><TestBuilder /></AppShell>} />
            <Route path="/test/:mode" element={<AppShell><TestBuilder /></AppShell>} />
            <Route path="/practice" element={<AppShell><PracticePage /></AppShell>} />
            <Route path="/practice/:mode" element={<AppShell><PracticeModeRoute /></AppShell>} />
            <Route path="/pyq" element={<AppShell><PyqPaperList /></AppShell>} />
            <Route path="/pyq/:exam" element={<AppShell><PyqPaperList /></AppShell>} />
            <Route path="/search" element={<AppShell><SearchPage /></AppShell>} />
            <Route path="/question-bank" element={<AppShell><SearchPage /></AppShell>} />
            <Route path="/leaderboard" element={<AppShell><LeaderboardPage /></AppShell>} />
            <Route path="/analytics" element={<AppShell><AnalyticsPage /></AppShell>} />
            <Route path="/mistakes" element={<AppShell><MistakesPage /></AppShell>} />
            <Route path="/bookmarks" element={<AppShell><BookmarksPage /></AppShell>} />
            <Route path="/flashcards" element={<AppShell><FlashcardsPage /></AppShell>} />
            <Route path="/formulas" element={<AppShell><FormulasPage /></AppShell>} />
            <Route path="/settings" element={<AppShell><SettingsPage /></AppShell>} />
            <Route path="/result/:id" element={<AppShell><TestResult /></AppShell>} />
            <Route path="/run/:id" element={<TestRunner />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </DataBootstrap>
    </QueryClientProvider>
  )
}
