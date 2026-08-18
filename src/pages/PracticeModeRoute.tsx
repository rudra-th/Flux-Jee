import { Navigate, useParams } from 'react-router-dom'
import TestBuilder from '@/pages/TestBuilder'

/**
 * Routes /practice/:mode to the right page for that mode.
 * Notebook modes redirect to their pages; everything else renders TestBuilder.
 */
export default function PracticeModeRoute() {
  const { mode } = useParams()
  if (mode === 'wrong') return <Navigate to="/mistakes" replace />
  if (mode === 'bookmarked') return <Navigate to="/bookmarks" replace />
  return <TestBuilder />
}
