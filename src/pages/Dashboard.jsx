import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { StatCard, Badge, StatusBadge, Avatar, Spinner } from '../components/ui'
import {
  BookOpen, DollarSign, Users, MessageSquare, Phone, UserCheck,
  TrendingUp, Clock, AlertCircle, Plane, ArrowRight
} from 'lucide-react'
import { clsx } from 'clsx'

function RecentItem({ item, type, onClick }) {
  if (type === 'reservation') return (
    <div className="flex items-center gap-3 py-3 border-b border-sb-border/60 last:border-b-0 hover:bg-sb-surface2 -mx-5 px-5 cursor-pointer transition-colors" onClick={onClick}>
      <div className="w-8 h-8 bg-sb-accentlt rounded-lg flex items-center justify-center flex-shrink-0">
        <Plane className="w-4 h-4 text-sb-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sb-text1 truncate">{item.reservation_code}</p>
        <p className="text-xs text-sb-text3">{item.origin} → {item.destination}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <StatusBadge status={item.status} />
        <p className="text-xs text-sb-text3 mt-1">${item.total_amount?.toLocaleString()}</p>
      </div>
    </div>
  )

  if (type === 'client') return (
    <div className="flex items-center gap-3 py-3 border-b border-sb-border/60 last:border-b-0 hover:bg-sb-surface2 -mx-5 px-5 cursor-pointer transition-colors" onClick={onClick}>
      <Avatar name={`${item.first_name} ${item.last_name}`} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sb-text1">{item.first_name} {item.last_name}</p>
        <p className="text-xs text-sb-text3">{item.country} · {item.email}</p>
      </div>
      <StatusBadge status={item.status} />
    </div>
  )

  if (type === 'message') return (
    <div className="flex items-center gap-3 py-3 border-b border-sb-border/60 last:border-b-0 hover:bg-sb-surface2 -mx-5 px-5 cursor-pointer transition-colors" onClick={onClick}>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
        item.channel === 'whatsapp' ? 'bg-green-500' : item.channel === 'instagram' ? 'bg-pink-500' : 'bg-blue-600')}>
        {item.channel === 'whatsapp' ? 'W' : item.channel === 'instagram' ? 'I' : 'F'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sb-text1 truncate">{item.contact_name || 'Desconocido'}</p>
        <p className="text-xs text-sb-text3 truncate">{item.last_message_preview || '...'}</p>
      </div>
      {item.unread_count > 0 && (
        <span className="w-5 h-5 bg-sb-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {item.unread_count}
        </span>
      )}
    </div>
  )

  if (type === 'task') return (
    <div className="flex items-center gap-3 py-2.5 border-b border-sb-border/60 last:border-b-0" onClick={onClick}>
      <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
        item.priority === 'urgent' ? 'bg-sb-danger' : item.priority === 'high' ? 'bg-sb-warning' : 'bg-sb-accent')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-sb-text1 truncate">{item.title}</p>
        {item.due_date && <p className="text-xs text-sb-text3">{new Date(item.due_date).toLocaleDateString('es-ES')}</p>}
      </div>
      <StatusBadge status={item.status} />
    </div>
  )
}

export default function Dashboard() {
  const { navigate, profile } = useApp()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [recent, setRecent] = useState({ reservations: [], clients: [], messages: [], tasks: [] })

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      const [resDay, resTotal, clients, messages, tasks, agentsRes] = await Promise.all([
        supabase.from('reservations').select('id, total_amount', { count: 'exact' }).gte('created_at', todayStr),
        supabase.from('reservations').select('total_amount').eq('status', 'confirmed'),
        supabase.from('clients').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('conversations').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'active'),
      ])

      const dayRevenue = resDay.data?.reduce((acc, r) => acc + (r.total_amount || 0), 0) || 0
      const monthRevenue = resTotal.data?.reduce((acc, r) => acc + (r.total_amount || 0), 0) || 0

      setStats({
        reservations_today: resDay.count || 0,
        revenue_today: dayRevenue,
        active_clients: clients.count || 0,
        pending_messages: messages.count || 0,
        pending_tasks: tasks.count || 0,
        agents_online: agentsRes.count || 0,
        month_revenue: monthRevenue,
      })

      // Load recent items
      const [recentRes, recentClients, recentMsgs, recentTasks] = await Promise.all([
        supabase.from('reservations').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('conversations').select('*').eq('status', 'open').order('last_message_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ])

      setRecent({
        reservations: recentRes.data || [],
        clients: recentClients.data || [],
        messages: recentMsgs.data || [],
        tasks: recentTasks.data || [],
      })
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-sb-text1">{greeting}, {profile?.full_name?.split(' ')[0] || 'Agente'} 👋</h2>
          <p className="text-sb-text3 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('flights')} className="btn-primary btn-sm">
            <Plane className="w-3.5 h-3.5" /> Buscar Vuelo
          </button>
          <button onClick={() => navigate('reservations')} className="btn-secondary btn-sm">
            <BookOpen className="w-3.5 h-3.5" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Reservas hoy" value={stats.reservations_today} icon={BookOpen} color="accent" subtitle="Nuevas reservas" />
        <StatCard title="Ingresos hoy" value={`$${(stats.revenue_today||0).toLocaleString()}`} icon={DollarSign} color="success" subtitle="USD confirmados" />
        <StatCard title="Clientes activos" value={stats.active_clients?.toLocaleString()} icon={Users} color="info" />
        <StatCard title="Mensajes pendientes" value={stats.pending_messages} icon={MessageSquare} color="warning" subtitle="Sin responder" />
        <StatCard title="Tareas pendientes" value={stats.pending_tasks} icon={Clock} color="danger" />
        <StatCard title="Agentes activos" value={stats.agents_online} icon={UserCheck} color="gold" />
      </div>

      {/* Revenue banner */}
      <div className="card p-5 bg-gradient-to-r from-sb-sidebaractive to-sb-accent border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Ingresos del mes (reservas confirmadas)</p>
            <p className="text-3xl font-bold mt-1">${(stats.month_revenue||0).toLocaleString('es-ES')} <span className="text-lg font-normal text-blue-200">USD</span></p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-semibold">En crecimiento</span>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Recent Reservations */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Reservas recientes</h3>
            <button onClick={() => navigate('reservations')} className="text-xs text-sb-accent hover:underline flex items-center gap-1">Ver todas <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="px-5 pb-3">
            {recent.reservations.length === 0 ? (
              <p className="text-center py-8 text-sb-text3 text-sm">No hay reservas aún</p>
            ) : recent.reservations.map(r => (
              <RecentItem key={r.id} item={r} type="reservation" onClick={() => navigate('reservations')} />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Mensajes pendientes</h3>
            <button onClick={() => navigate('conversations')} className="text-xs text-sb-accent hover:underline flex items-center gap-1">Ver <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="px-5 pb-3">
            {recent.messages.length === 0 ? (
              <p className="text-center py-8 text-sb-text3 text-sm">Sin mensajes pendientes</p>
            ) : recent.messages.map(m => (
              <RecentItem key={m.id} item={m} type="message" onClick={() => navigate('conversations')} />
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Tareas pendientes</h3>
            <button onClick={() => navigate('tasks')} className="text-xs text-sb-accent hover:underline flex items-center gap-1">Ver <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="px-5 pb-3">
            {recent.tasks.length === 0 ? (
              <p className="text-center py-8 text-sb-text3 text-sm">Sin tareas pendientes</p>
            ) : recent.tasks.map(t => (
              <RecentItem key={t.id} item={t} type="task" onClick={() => navigate('tasks')} />
            ))}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Clientes recientes</h3>
            <button onClick={() => navigate('clients')} className="text-xs text-sb-accent hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="px-5 pb-3">
            {recent.clients.length === 0 ? (
              <p className="text-center py-8 text-sb-text3 text-sm">No hay clientes aún</p>
            ) : recent.clients.map(c => (
              <RecentItem key={c.id} item={c} type="client" onClick={() => navigate('clients')} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card xl:col-span-2">
          <div className="card-header"><h3 className="text-sm font-semibold">Acciones rápidas</h3></div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Buscar vuelo', icon: Plane, mod: 'flights', color: 'bg-sb-accentlt text-sb-accent' },
              { label: 'Nueva reserva', icon: BookOpen, mod: 'reservations', color: 'bg-sb-successlt text-sb-success' },
              { label: 'Nuevo cliente', icon: Users, mod: 'clients', color: 'bg-sb-infolt text-sb-info' },
              { label: 'Nueva tarea', icon: Clock, mod: 'tasks', color: 'bg-sb-warninglt text-sb-warning' },
              { label: 'Conversaciones', icon: MessageSquare, mod: 'conversations', color: 'bg-pink-50 text-pink-500' },
              { label: 'Reportes', icon: TrendingUp, mod: 'reports', color: 'bg-violet-50 text-violet-500' },
            ].map(({ label, icon: Icon, mod, color }) => (
              <button key={mod} onClick={() => navigate(mod)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sb-surface2 border border-sb-border transition-all text-left">
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-medium text-sb-text1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
