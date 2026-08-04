import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { DataBootstrap } from '@/components/layout/DataBootstrap'
import { useSettingsStore, applyTheme } from '@/stores/settingsStore'
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
import { warmSearchIndex } from '@/engines/search/engine'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

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
            <Route path="/" element={<AppShell><HomePage /></AppShell>} />
            <Route path="/test" element={<AppShell><TestBuilder /></AppShell>} />
            <Route path="/test/:mode" element={<AppShell><TestBuilder /></AppShell>} />
            <Route path="/practice" element={<AppShell><PracticePage /></AppShell>} />
            <Route path="/practice/:mode" element={<AppShell><PracticeModeRoute /></AppShell>} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataBootstrap>
    </QueryClientProvider>
  )
}
