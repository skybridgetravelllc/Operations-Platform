import { useApp } from '../../context/AppContext'
import { Avatar } from '../ui'
import {
  LayoutDashboard, Users, BookOpen, Plane, Hotel, MessageSquare,
  Phone, Users2, CheckSquare, Bell, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, Wifi
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'clients',        label: 'Clientes',          icon: Users },
  { id: 'reservations',   label: 'Reservas',          icon: BookOpen },
  { id: 'flights',        label: 'Vuelos',            icon: Plane },
  { id: 'hotels',         label: 'Hoteles',           icon: Hotel },
  { id: 'conversations',  label: 'Conversaciones',    icon: MessageSquare },
  { id: 'calls',          label: 'Llamadas',          icon: Phone },
  { id: 'team',           label: 'Equipo',            icon: Users2 },
  { id: 'tasks',          label: 'Tareas',            icon: CheckSquare },
  { id: 'notifications',  label: 'Notificaciones',    icon: Bell },
  { id: 'reports',        label: 'Reportes',          icon: BarChart3 },
  { id: 'settings',       label: 'Configuración',     icon: Settings },
]

export default function Sidebar() {
  const { currentModule, navigate, sidebarOpen, dispatch, profile, unreadCount, signOutUser } = useApp()

  return (
    <div className={clsx('sb-sidebar', sidebarOpen ? 'w-[240px]' : 'w-[64px]')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-sb-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm leading-tight">Skybridge</p>
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Travel Ops</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = currentModule === id
            const isBell = id === 'notifications'
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={clsx('sb-nav-item w-full text-left', isActive && 'active')}
                title={!sidebarOpen ? label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="icon" />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-sb-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-sb-accent rounded-full flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom: online status + user + toggle */}
      <div className="border-t border-white/10 p-3 flex-shrink-0 space-y-2">
        {/* System status */}
        {sidebarOpen && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Wifi className="w-3 h-3 text-sb-success" />
            <span className="text-[11px] text-slate-400">Sistema conectado</span>
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group">
          <Avatar name={profile?.full_name || 'Usuario'} src={profile?.avatar_url} size="sm" />
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-slate-500 text-[10px] truncate capitalize">{profile?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOutUser}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
