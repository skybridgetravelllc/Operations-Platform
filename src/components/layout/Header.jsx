import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../ui'
import { Search, Bell, Plus, Calendar, ChevronDown, RefreshCw, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '../../lib/supabase'

const MODULE_TITLES = {
  dashboard:'Dashboard', clients:'Gestión de Clientes', reservations:'Reservas',
  flights:'Búsqueda de Vuelos', hotels:'Búsqueda de Hoteles', conversations:'Conversaciones',
  calls:'Centro de Llamadas', team:'Equipo', tasks:'Tareas', notifications:'Notificaciones',
  reports:'Reportes', settings:'Configuración',
}

export default function Header() {
  const { sidebarOpen, currentModule, profile, navigate, showToast, dispatch, metaPanelOpen, unreadCount } = useApp()
  const [calOpen, setCalOpen] = useState(false)
  const [calEvents, setCalEvents] = useState([])
  const [loadingCal, setLoadingCal] = useState(false)
  const [time, setTime] = useState(new Date())
  const calRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const h = e => { if (!calRef.current?.contains(e.target)) setCalOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const sidebarW = sidebarOpen ? 240 : 64
  const today = time.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })

  async function loadCal() {
    setLoadingCal(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar?action=list`, {
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }
      })
      const data = await res.json()
      if (data.code === 'NOT_CONNECTED') { showToast('Conecta Google Calendar en Configuración', 'warning'); setCalOpen(false) }
      else setCalEvents(data.events || [])
    } catch { showToast('Error al cargar calendario', 'error') }
    finally { setLoadingCal(false) }
  }

  return (
    <header className="fixed top-0 right-0 z-30 bg-white border-b border-sb-border h-[60px] flex items-center px-4 gap-3 transition-all duration-200" style={{ left: sidebarW }}>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-sb-text1 truncate">{MODULE_TITLES[currentModule] || currentModule}</h1>
        <p className="text-[11px] text-sb-text3 capitalize hidden sm:block">{today}</p>
      </div>

      <div className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sb-text3 pointer-events-none" />
        <input placeholder="Buscar clientes, reservas..." className="pl-8 pr-3 py-2 text-xs bg-sb-surface2 border border-sb-border rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-sb-accent/20 focus:border-sb-accent transition-all" />
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => navigate('reservations')} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sb-accent text-white text-xs font-semibold rounded-lg hover:bg-sb-accenthov transition-colors">
          <Plus className="w-3.5 h-3.5" /><span>Nueva Reserva</span>
        </button>

        {/* Google Calendar */}
        <div className="relative" ref={calRef}>
          <button onClick={() => { setCalOpen(o => !o); if (!calOpen && calEvents.length === 0) loadCal() }} className="btn-icon" title="Google Calendar">
            <Calendar className="w-4 h-4" />
          </button>
          {calOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-sb-border rounded-xl shadow-dropdown z-50 overflow-hidden animate-fade-in" style={{ width: 300 }}>
              <div className="px-4 py-3 border-b border-sb-border flex items-center justify-between">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-sb-danger" /><span className="text-sm font-semibold">Google Calendar</span></div>
                <button onClick={loadCal} className="btn-icon p-1"><RefreshCw className={clsx('w-3.5 h-3.5', loadingCal && 'animate-spin')} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {loadingCal ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-sb-text3" /></div> :
                  calEvents.length === 0 ? (
                    <div className="py-8 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-sb-text3 opacity-30" />
                      <p className="text-sm text-sb-text3">Sin eventos próximos</p>
                      <button onClick={() => { setCalOpen(false); navigate('settings') }} className="mt-2 text-xs text-sb-accent hover:underline">Conectar Google →</button>
                    </div>
                  ) : calEvents.map(e => (
                    <div key={e.id} className="px-4 py-3 border-b border-sb-border/50 hover:bg-sb-surface2 transition-colors">
                      <p className="text-sm font-medium text-sb-text1 truncate">{e.summary}</p>
                      <p className="text-xs text-sb-text3 mt-0.5">{e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString('es-ES', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : e.start?.date}</p>
                      {e.location && <p className="text-xs text-sb-text3 truncate mt-0.5">📍 {e.location}</p>}
                    </div>
                  ))}
              </div>
              <div className="px-4 py-2.5 border-t border-sb-border">
                <button onClick={() => { setCalOpen(false); navigate('settings') }} className="text-xs text-sb-accent hover:underline">Gestionar integración →</button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button onClick={() => navigate('notifications')} className="btn-icon relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sb-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        {/* META PANEL TOGGLE */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_META_PANEL' })}
          title="Panel Meta Business — WhatsApp / Instagram / Facebook"
          className={clsx('relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            metaPanelOpen ? 'bg-sb-sidebar text-white border-sb-sidebar shadow-md' : 'bg-white text-sb-text2 border-sb-border hover:border-sb-accent hover:text-sb-accent')}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Meta</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-sb-border">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-sb-text1 leading-tight">{profile?.full_name?.split(' ')[0] || 'Usuario'}</p>
            <p className="text-[10px] text-sb-text3 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronDown className="w-3 h-3 text-sb-text3 hidden md:block" />
        </div>
      </div>
    </header>
  )
}
