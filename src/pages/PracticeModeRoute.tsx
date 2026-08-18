import { Navigate, useParams } from 'react-router-dom'
import TestBuilder from '@/pages/TestBuilder'

/**
 * Routes /practice/:mode to the right page for that mode.
 * Test-centric modes (mixed, daily, pyq, marathon, speed, revision, adaptive,
 * weak) render the TestBuilder; notebook modes redirect to their pages.
 */
export default function PracticeModeRoute() {
  const { mode } = useParams()
  if (mode === 'wrong') return <Navigate to="/mistakes" replace />
  if (mode === 'bookmarked') return <Navigate to="/bookmarks" replace />
  return <TestBuilder />
}
