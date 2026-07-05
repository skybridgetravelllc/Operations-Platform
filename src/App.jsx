import { Suspense, lazy, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import { Spinner } from './components/ui'

const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Clients       = lazy(() => import('./pages/Clients'))
const Reservations  = lazy(() => import('./pages/Reservations'))
const Flights       = lazy(() => import('./pages/Flights'))
const Hotels        = lazy(() => import('./pages/Hotels'))
const Conversations = lazy(() => import('./pages/Conversations'))
const Calls         = lazy(() => import('./pages/Calls'))
const Team          = lazy(() => import('./pages/Team'))
const Tasks         = lazy(() => import('./pages/Tasks'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Reports       = lazy(() => import('./pages/Reports'))
const Settings      = lazy(() => import('./pages/Settings'))

const MODULE_MAP = {
  dashboard: Dashboard, clients: Clients, reservations: Reservations,
  flights: Flights, hotels: Hotels, conversations: Conversations,
  calls: Calls, team: Team, tasks: Tasks, notifications: Notifications,
  reports: Reports, settings: Settings,
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

function AppRouter() {
  const { isLoading, isAuthenticated, currentModule, navigate } = useApp()

  // Sync URL on mount
  useEffect(() => {
    const path = window.location.pathname.replace('/', '') || 'dashboard'
    if (MODULE_MAP[path]) navigate(path)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-sb-accent rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <Spinner size="md" />
          <p className="text-slate-400 text-sm">Cargando Skybridge Travel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Login />

  const Page = MODULE_MAP[currentModule] || Dashboard

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Page />
      </Suspense>
    </AppLayout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}
