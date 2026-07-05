import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Spinner, StatCard } from '../components/ui'
import { BarChart3, TrendingUp, DollarSign, Users, BookOpen, MessageSquare, Phone, Plane, Hotel, RefreshCw } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#BE185D']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-sb-border rounded-xl shadow-dropdown p-3">
      <p className="text-xs font-bold text-sb-text1 mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} className="text-xs" style={{ color: e.color }}>{e.name}: <strong>{typeof e.value === 'number' && e.value > 100 ? `$${e.value.toLocaleString()}` : e.value}</strong></p>)}
    </div>
  )
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')
  const [stats, setStats] = useState({})
  const [revenueData, setRevenueData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [channelData, setChannelData] = useState([])
  const [agentData, setAgentData] = useState([])

  useEffect(() => { loadReports() }, [range])

  async function loadReports() {
    setLoading(true)
    try {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const [resAll, clientsAll, convAll, tasksAll, paymentsAll] = await Promise.all([
        supabase.from('reservations').select('id,status,total_amount,currency,created_at,assigned_agent_id').gte('created_at', from),
        supabase.from('clients').select('id,status,created_at').gte('created_at', from),
        supabase.from('conversations').select('id,channel,created_at').gte('created_at', from),
        supabase.from('tasks').select('id,status,created_at').gte('created_at', from),
        supabase.from('payments').select('id,amount,currency,status,created_at').gte('created_at', from).eq('status', 'completed'),
      ])

      const reservations = resAll.data || []
      const clients = clientsAll.data || []
      const conversations = convAll.data || []
      const payments = paymentsAll.data || []

      const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount), 0)
      const confirmedRes = reservations.filter(r => ['confirmed','issued','completed'].includes(r.status))

      setStats({
        total_reservations: reservations.length,
        confirmed_reservations: confirmedRes.length,
        total_revenue: totalRevenue,
        new_clients: clients.length,
        total_conversations: conversations.length,
        completed_tasks: (tasksAll.data || []).filter(t => t.status === 'completed').length,
        conversion_rate: reservations.length > 0 ? Math.round((confirmedRes.length / reservations.length) * 100) : 0,
      })

      // Revenue by day (last N days)
      const dayMap = {}
      for (let i = 0; i < Math.min(days, 30); i++) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        dayMap[key] = { date: key, reservas: 0, ingresos: 0 }
      }
      reservations.forEach(r => {
        const key = new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        if (dayMap[key]) { dayMap[key].reservas += 1; dayMap[key].ingresos += parseFloat(r.total_amount || 0) }
      })
      setRevenueData(Object.values(dayMap).reverse())

      // Status distribution
      const statusMap = {}
      reservations.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1 })
      setStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })))

      // Channel distribution
      const channelMap = { whatsapp: 0, instagram: 0, facebook: 0, email: 0, phone: 0 }
      conversations.forEach(c => { if (channelMap[c.channel] !== undefined) channelMap[c.channel]++ })
      setChannelData(Object.entries(channelMap).map(([channel, total]) => ({ channel, total })))

      // Agent performance
      const agentMap = {}
      reservations.forEach(r => {
        if (r.assigned_agent_id) {
          if (!agentMap[r.assigned_agent_id]) agentMap[r.assigned_agent_id] = { id: r.assigned_agent_id, reservas: 0, ingresos: 0 }
          agentMap[r.assigned_agent_id].reservas++
          agentMap[r.assigned_agent_id].ingresos += parseFloat(r.total_amount || 0)
        }
      })
      // Get agent names
      if (Object.keys(agentMap).length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id,full_name').in('id', Object.keys(agentMap))
        const agArr = Object.values(agentMap).map(a => ({ ...a, name: profs?.find(p => p.id === a.id)?.full_name || 'Agente' })).sort((a, b) => b.reservas - a.reservas).slice(0, 6)
        setAgentData(agArr)
      } else {
        setAgentData([])
      }
    } catch (err) {
      console.error('Reports error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[{v:'7d',l:'7 días'},{v:'30d',l:'30 días'},{v:'90d',l:'90 días'},{v:'1y',l:'1 año'}].map(r => (
            <button key={r.v} onClick={() => setRange(r.v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range===r.v ? 'bg-sb-accent text-white' : 'bg-white border border-sb-border text-sb-text2 hover:border-sb-accent'}`}>{r.l}</button>
          ))}
        </div>
        <button onClick={loadReports} className="btn-icon border border-sb-border"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Reservas" value={stats.total_reservations} icon={BookOpen} color="accent" />
        <StatCard title="Ingresos" value={`$${(stats.total_revenue||0).toLocaleString('es-ES',{maximumFractionDigits:0})}`} icon={DollarSign} color="success" />
        <StatCard title="Nuevos Clientes" value={stats.new_clients} icon={Users} color="info" />
        <StatCard title="Conversión" value={`${stats.conversion_rate}%`} icon={TrendingUp} color="gold" subtitle="Reservas confirmadas" />
      </div>

      {/* Revenue + Reservations trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Ingresos por día</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingresos" name="Ingresos ($)" stroke="#2563EB" fill="url(#revenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Reservas por día</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reservas" name="Reservas" fill="#059669" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status + Channel distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Reservas por estado</h3>
          {statusData.length === 0 ? <p className="text-center py-8 text-sb-text3 text-sm">Sin datos</p> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Reservas']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-sb-text3 capitalize">{s.name}: {s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Mensajes por canal</h3>
          {channelData.every(c => c.total === 0) ? <p className="text-center py-8 text-sb-text3 text-sm">Sin datos</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Mensajes" radius={[0,4,4,0]}>
                  {channelData.map((e, i) => <Cell key={i} fill={['#16a34a','#ec4899','#2563EB','#64748b','#f97316'][i] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Resumen de operaciones</h3>
          <div className="space-y-3">
            {[
              { label: 'Reservas confirmadas', value: stats.confirmed_reservations, icon: '✅', total: stats.total_reservations },
              { label: 'Conversaciones activas', value: stats.total_conversations, icon: '💬', total: null },
              { label: 'Tareas completadas', value: stats.completed_tasks, icon: '☑️', total: null },
              { label: 'Tasa de conversión', value: `${stats.conversion_rate}%`, icon: '📈', total: null },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-xl">
                <span className="text-lg">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-sb-text3">{s.label}</p>
                  {s.total !== null && s.total > 0 && (
                    <div className="h-1 bg-sb-border rounded-full mt-1"><div className="h-1 bg-sb-accent rounded-full" style={{ width: `${Math.round((s.value/s.total)*100)}%` }} /></div>
                  )}
                </div>
                <p className="font-bold text-sb-text1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent performance */}
      {agentData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4">Rendimiento por agente</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="reservas" name="Reservas" fill="#2563EB" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="ingresos" name="Ingresos ($)" fill="#059669" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
