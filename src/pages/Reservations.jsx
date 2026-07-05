import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Badge, StatusBadge, Table, SearchBar, Modal, Input, Select, Spinner, Avatar, EmptyState } from '../components/ui'
import { BookOpen, Plus, ChevronLeft, Plane, Hotel, CreditCard, FileText, Edit3, Calendar, Clock, User, DollarSign, Check, X, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

const STATUSES = ['new','pending','quoted','confirmed','issued','cancelled','completed','refunded']
const STATUS_COLORS = { new:'accent', pending:'warning', quoted:'info', confirmed:'success', issued:'success', cancelled:'danger', completed:'gray', refunded:'warning' }

function ReservationForm({ open, onClose, onSaved }) {
  const { user, showToast } = useApp()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({ client_id:'', type:'flight', origin:'', destination:'', departure_date:'', return_date:'', adults:1, children:0, cabin_class:'economy', total_amount:'', currency:'USD', status:'new', assigned_agent_id:'', notes:'' })

  useEffect(() => {
    if (open) {
      supabase.from('clients').select('id,first_name,last_name').order('first_name').limit(200).then(({data}) => setClients(data||[]))
      supabase.from('profiles').select('id,full_name').eq('status','active').order('full_name').then(({data}) => setAgents(data||[]))
      setForm(f => ({...f, assigned_agent_id: user?.id || ''}))
    }
  }, [open])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  async function save() {
    if (!form.destination) { showToast('Destino requerido', 'warning'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('reservations').insert(form)
      if (error) throw error
      showToast('Reserva creada', 'success'); onSaved(); onClose()
    } catch(e){ showToast(e.message,'error') } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Reserva" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={loading}>Crear Reserva</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Cliente</label>
          <select className="form-input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
            <option value="">— Sin cliente —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Tipo</label>
          <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="flight">Vuelo</option><option value="hotel">Hotel</option><option value="package">Paquete</option><option value="transfer">Transfer</option>
          </select>
        </div>
        <Input label="Origen" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ciudad / Código IATA" />
        <Input label="Destino *" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Ciudad / Código IATA" />
        <div>
          <label className="form-label">Fecha salida</label>
          <input type="date" className="form-input" value={form.departure_date} onChange={e => set('departure_date', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Fecha regreso</label>
          <input type="date" className="form-input" value={form.return_date} onChange={e => set('return_date', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Adultos</label>
          <input type="number" min={1} max={9} className="form-input" value={form.adults} onChange={e => set('adults', parseInt(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Niños</label>
          <input type="number" min={0} max={6} className="form-input" value={form.children} onChange={e => set('children', parseInt(e.target.value))} />
        </div>
        <div>
          <label className="form-label">Importe total</label>
          <input type="number" step="0.01" className="form-input" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="form-label">Moneda</label>
          <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
            <option>USD</option><option>EUR</option><option>GBP</option><option>MXN</option><option>COP</option><option>ARS</option>
          </select>
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Agente asignado</label>
          <select className="form-input" value={form.assigned_agent_id} onChange={e => set('assigned_agent_id', e.target.value)}>
            <option value="">— Sin asignar —</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="form-label">Notas</label>
          <textarea rows={2} className="form-input resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas o instrucciones especiales..." />
        </div>
      </div>
    </Modal>
  )
}

function ReservationDetail({ res, onBack, onRefresh }) {
  const { showToast } = useApp()
  const [flights, setFlights] = useState([])
  const [hotelBookings, setHotelBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newStatus, setNewStatus] = useState(res.status)
  const [client, setClient] = useState(null)
  const { user } = useApp()

  useEffect(() => {
    if (!res) return
    Promise.all([
      supabase.from('flight_bookings').select('*').eq('reservation_id', res.id),
      supabase.from('hotel_bookings').select('*').eq('reservation_id', res.id),
      supabase.from('payments').select('*').eq('reservation_id', res.id).order('created_at', { ascending: false }),
      supabase.from('notes').select('*, profiles(full_name)').eq('reservation_id', res.id).order('created_at', { ascending: false }),
      res.client_id ? supabase.from('clients').select('*').eq('id', res.client_id).single() : Promise.resolve({ data: null }),
    ]).then(([f, h, p, n, c]) => {
      setFlights(f.data || [])
      setHotelBookings(h.data || [])
      setPayments(p.data || [])
      setNotes(n.data || [])
      setClient(c.data)
    })
  }, [res?.id])

  async function updateStatus() {
    const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', res.id)
    if (!error) { showToast('Estado actualizado', 'success'); onRefresh() }
  }

  async function addNote() {
    if (!newNote.trim()) return
    await supabase.from('notes').insert({ content: newNote, author_id: user?.id, reservation_id: res.id })
    setNewNote('')
    supabase.from('notes').select('*, profiles(full_name)').eq('reservation_id', res.id).order('created_at', { ascending: false }).then(({data}) => setNotes(data||[]))
  }

  async function addPayment() {
    const amount = prompt('Importe del pago (USD):')
    if (!amount || isNaN(parseFloat(amount))) return
    const method = prompt('Método (credit_card/bank_transfer/stripe/paypal/cash):') || 'cash'
    await supabase.from('payments').insert({ reservation_id: res.id, client_id: res.client_id, amount: parseFloat(amount), currency: res.currency, method, status: 'completed', processed_by: user?.id, processed_at: new Date().toISOString() })
    supabase.from('payments').select('*').eq('reservation_id', res.id).order('created_at', { ascending: false }).then(({data}) => setPayments(data||[]))
    showToast('Pago registrado', 'success')
  }

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + parseFloat(p.amount), 0)
  const balance = parseFloat(res.total_amount || 0) - totalPaid

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-icon"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{res.reservation_code}</h2>
          <p className="text-xs text-sb-text3">{res.origin && `${res.origin} → `}{res.destination} · {res.departure_date}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-input w-36">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" onClick={updateStatus}>Actualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: main info */}
        <div className="xl:col-span-2 space-y-4">
          {/* Client */}
          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Cliente</p>
            {client ? (
              <div className="flex items-center gap-3">
                <Avatar name={`${client.first_name} ${client.last_name}`} />
                <div>
                  <p className="font-semibold">{client.first_name} {client.last_name}</p>
                  <p className="text-xs text-sb-text3">{client.email} · {client.phone}</p>
                </div>
                <StatusBadge status={client.status} />
              </div>
            ) : <p className="text-sm text-sb-text3">Sin cliente asignado</p>}
          </div>

          {/* Flights */}
          {flights.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-bold text-sb-text2 uppercase mb-3 flex items-center gap-2"><Plane className="w-3.5 h-3.5" /> Vuelos</p>
              {flights.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{f.origin_iata} → {f.destination_iata}</p>
                    <p className="text-xs text-sb-text3">{f.airline_name} · {f.departure_at && new Date(f.departure_at).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</p>
                    <p className="text-xs font-mono text-sb-text3">Orden: {f.provider_order_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${parseFloat(f.total_amount||0).toLocaleString()}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full', f.status==='confirmed' ? 'bg-sb-successlt text-sb-success' : 'bg-sb-warninglt text-sb-warning')}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hotels */}
          {hotelBookings.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-bold text-sb-text2 uppercase mb-3 flex items-center gap-2"><Hotel className="w-3.5 h-3.5" /> Hoteles</p>
              {hotelBookings.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{h.hotel_name}</p>
                    <p className="text-xs text-sb-text3">{h.check_in} → {h.check_out} · {h.nights} noches · {h.rooms} hab.</p>
                    <p className="text-xs font-mono text-sb-text3">Ref: {h.provider_booking_id}</p>
                  </div>
                  <p className="font-bold">${parseFloat(h.total_amount||0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Notas internas</p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {notes.map(n => (
                <div key={n.id} className="bg-sb-surface2 rounded-lg p-3">
                  <p className="text-sm text-sb-text1">{n.content}</p>
                  <p className="text-xs text-sb-text3 mt-1">{n.profiles?.full_name} · {new Date(n.created_at).toLocaleString('es-ES')}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-sb-text3 text-center py-4">Sin notas</p>}
            </div>
            <div className="flex gap-2">
              <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Agregar nota..." className="form-input flex-1 text-sm" />
              <Button size="sm" onClick={addNote}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Resumen financiero</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-sb-text2">Total</span><span className="font-bold">{parseFloat(res.total_amount||0).toLocaleString()} {res.currency}</span></div>
              <div className="flex justify-between text-sm"><span className="text-sb-text2">Pagado</span><span className="font-bold text-sb-success">{totalPaid.toLocaleString()} {res.currency}</span></div>
              <div className="flex justify-between text-sm border-t border-sb-border pt-2"><span className="text-sb-text2">Saldo pendiente</span><span className={clsx('font-bold', balance > 0 ? 'text-sb-danger' : 'text-sb-success')}>{balance.toLocaleString()} {res.currency}</span></div>
            </div>
            <Button size="sm" className="w-full" onClick={addPayment}><CreditCard className="w-3.5 h-3.5" /> Registrar Pago</Button>
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Pagos</p>
            {payments.length === 0 ? <p className="text-sm text-sb-text3 text-center py-3">Sin pagos registrados</p> :
              payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-sb-border/50 last:border-b-0">
                  <div><p className="text-sm font-medium">{parseFloat(p.amount).toLocaleString()} {p.currency}</p><p className="text-xs text-sb-text3 capitalize">{p.method?.replace('_',' ')} · {p.status}</p></div>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full', p.status==='completed' ? 'bg-sb-successlt text-sb-success' : 'bg-sb-warninglt text-sb-warning')}>{p.status}</span>
                </div>
              ))}
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Detalles</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2"><Calendar className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span>{res.departure_date || '—'} {res.return_date && `→ ${res.return_date}`}</span></div>
              <div className="flex gap-2"><User className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span>{res.adults || 0} adultos, {res.children || 0} niños</span></div>
              <div className="flex gap-2"><Clock className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span>Creada: {new Date(res.created_at).toLocaleDateString('es-ES')}</span></div>
              {res.gds_pnr && <div className="flex gap-2"><FileText className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span className="font-mono">PNR: {res.gds_pnr}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Reservations() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reservations').select('*, clients(first_name,last_name), profiles!assigned_agent_id(full_name)').order('created_at', { ascending: false }).limit(100)
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (search) q = q.or(`reservation_code.ilike.%${search}%,destination.ilike.%${search}%,origin.ilike.%${search}%`)
    const { data: d } = await q
    setData(d || [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('res_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const cols = [
    { key: 'reservation_code', label: 'Código', render: v => <span className="font-mono font-bold text-sb-accent">{v}</span> },
    { key: 'client', label: 'Cliente', render: (_, r) => <span className="font-medium">{r.clients ? `${r.clients.first_name} ${r.clients.last_name}` : '—'}</span> },
    { key: 'route', label: 'Ruta', render: (_, r) => <span className="text-sm">{r.origin ? `${r.origin} → ` : ''}{r.destination || '—'}</span> },
    { key: 'departure_date', label: 'Salida', render: v => <span className="text-sm">{v || '—'}</span> },
    { key: 'status', label: 'Estado', render: (_, r) => <StatusBadge status={r.status} /> },
    { key: 'total_amount', label: 'Importe', render: (v, r) => <span className="font-bold">{v ? `${parseFloat(v).toLocaleString()} ${r.currency}` : '—'}</span> },
    { key: 'profiles', label: 'Agente', render: v => <span className="text-sm text-sb-text3">{v?.full_name || '—'}</span> },
    { key: 'created_at', label: 'Creada', render: v => <span className="text-xs text-sb-text3">{v ? new Date(v).toLocaleDateString('es-ES') : '—'}</span> },
  ]

  if (selected) return <ReservationDetail res={selected} onBack={() => setSelected(null)}
    onRefresh={() => { load(); supabase.from('reservations').select('*, clients(first_name,last_name)').eq('id', selected.id).single().then(({data:d}) => d && setSelected(d)) }} />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex gap-3 flex-1">
          <SearchBar placeholder="Buscar por código, ruta..." value={search} onChange={v => setSearch(v)} className="w-64" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-40">
            <option value="all">Todos los estados</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Nueva Reserva</Button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 flex-wrap">
        {[{s:'new',l:'Nuevas'},{s:'confirmed',l:'Confirmadas'},{s:'issued',l:'Emitidas'},{s:'pending',l:'Pendientes'},{s:'cancelled',l:'Canceladas'}].map(({s,l}) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter===s?'all':s)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all', statusFilter===s ? 'bg-sb-accent text-white border-sb-accent' : 'bg-white border-sb-border text-sb-text2 hover:border-sb-accent')}>
            {l}: {data.filter(r=>r.status===s).length}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <Table columns={cols} data={data} loading={loading} onRowClick={setSelected} emptyText="No hay reservas" />
      </div>

      <ReservationForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  )
}
