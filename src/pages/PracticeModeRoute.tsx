import { Navigate, useParams } from 'react-router-dom'
import TestBuilder from '@/pages/TestBuilder'

export default function PracticeModeRoute() {
  const { mode } = useParams()
  if (mode === 'bookmarked') return <Navigate to="/bookmarks" replace />
  return <TestBuilder />
}
