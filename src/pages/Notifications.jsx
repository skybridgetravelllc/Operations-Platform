import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Spinner } from '../components/ui'
import { Bell, BookOpen, MessageSquare, Phone, CreditCard, CheckSquare, Star, AlertTriangle, Check, Trash2, RefreshCw, Filter } from 'lucide-react'
import { clsx } from 'clsx'

const TYPE_CONFIG = {
  reservation: { icon: BookOpen, color: 'text-sb-accent bg-sb-accentlt', label: 'Reserva' },
  message: { icon: MessageSquare, color: 'text-green-600 bg-green-50', label: 'Mensaje' },
  call: { icon: Phone, color: 'text-sb-success bg-sb-successlt', label: 'Llamada' },
  task: { icon: CheckSquare, color: 'text-sb-warning bg-sb-warninglt', label: 'Tarea' },
  payment: { icon: CreditCard, color: 'text-purple-600 bg-purple-50', label: 'Pago' },
  system: { icon: AlertTriangle, color: 'text-sb-danger bg-sb-dangerlt', label: 'Sistema' },
  alert: { icon: AlertTriangle, color: 'text-sb-danger bg-sb-dangerlt', label: 'Alerta' },
  vip: { icon: Star, color: 'text-sb-gold bg-sb-goldlt', label: 'VIP' },
}

export default function Notifications() {
  const { user, dispatch, loadNotifications } = useApp()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread | read

  useEffect(() => { load() }, [filter])

  // Realtime
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('notifs_page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id])

  async function load() {
    setLoading(true)
    let q = supabase.from('notifications').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(100)
    if (filter === 'unread') q = q.eq('is_read', false)
    else if (filter === 'read') q = q.eq('is_read', true)
    const { data } = await q
    setNotifs(data || [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    loadNotifications()
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    loadNotifications()
  }

  async function deleteNotif(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    loadNotifications()
  }

  async function clearAll() {
    if (!confirm('¿Eliminar todas las notificaciones?')) return
    await supabase.from('notifications').delete().eq('user_id', user?.id)
    setNotifs([])
    loadNotifications()
  }

  const unread = notifs.filter(n => !n.is_read).length

  function timeAgo(dt) {
    const diff = Date.now() - new Date(dt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora mismo'
    if (mins < 60) return `Hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    return `Hace ${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-sb-accent" />
          <h2 className="font-bold text-sb-text1">Notificaciones</h2>
          {unread > 0 && <span className="px-2 py-0.5 bg-sb-accent text-white text-xs font-bold rounded-full">{unread} sin leer</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-icon border border-sb-border"><RefreshCw className="w-4 h-4" /></button>
          {unread > 0 && <Button size="sm" variant="secondary" onClick={markAllRead}><Check className="w-3.5 h-3.5" /> Marcar todas leídas</Button>}
          {notifs.length > 0 && <Button size="sm" variant="ghost" onClick={clearAll}><Trash2 className="w-3.5 h-3.5" /> Limpiar</Button>}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[{v:'all',l:'Todas'},{v:'unread',l:'Sin leer'},{v:'read',l:'Leídas'}].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={clsx('px-4 py-1.5 rounded-lg text-xs font-semibold transition-all', filter===f.v ? 'bg-sb-accent text-white' : 'bg-white border border-sb-border text-sb-text2 hover:border-sb-accent')}>{f.l}</button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-12 h-12 text-sb-text3 mb-3 opacity-30" />
            <p className="font-semibold text-sb-text1">Sin notificaciones</p>
            <p className="text-sm text-sb-text3 mt-1">Aquí aparecerán tus alertas y avisos</p>
          </div>
        ) : (
          <div className="divide-y divide-sb-border">
            {notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
              const Icon = cfg.icon
              return (
                <div key={n.id} className={clsx('flex items-start gap-4 px-5 py-4 group transition-colors', !n.is_read ? 'bg-sb-accentlt/30' : 'hover:bg-sb-surface2')}>
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={clsx('text-sm', !n.is_read ? 'font-bold text-sb-text1' : 'font-medium text-sb-text1')}>{n.title}</p>
                        {n.message && <p className="text-xs text-sb-text3 mt-0.5 leading-relaxed">{n.message}</p>}
                        <p className="text-[10px] text-sb-text3 mt-1.5 flex items-center gap-1">
                          <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', cfg.color)}>{cfg.label}</span>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-sb-accent flex-shrink-0 mt-1.5" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-sb-accentlt text-sb-accent transition-colors" title="Marcar como leída">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg hover:bg-sb-dangerlt text-sb-danger transition-colors" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
