import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Badge, StatusBadge, Avatar, Table, SearchBar, Modal, Input, Select, Textarea, Spinner, EmptyState } from '../components/ui'
import { Users, Plus, Phone, Mail, Globe, Star, FileText, MessageSquare, BookOpen, Edit3, Trash2, ChevronLeft, Upload } from 'lucide-react'
import { clsx } from 'clsx'

const COUNTRIES = ['Cuba','España','Estados Unidos','México','Colombia','Argentina','Chile','Perú','Venezuela','Ecuador','Brasil','República Dominicana','Puerto Rico','Panamá','Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua','Bolivia','Uruguay','Paraguay','Bahamas','Jamaica','Trinidad y Tobago','Barbados']

// ─── CLIENT FORM MODAL ───────────────────────────────────────────────────────
function ClientForm({ open, onClose, client, onSaved }) {
  const { showToast, user } = useApp()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ first_name:'',last_name:'',email:'',phone:'',whatsapp:'',country:'',city:'',nationality:'',date_of_birth:'',gender:'',status:'active',source:'',notes:'' })

  useEffect(() => {
    if (client) setForm({ first_name:client.first_name||'', last_name:client.last_name||'', email:client.email||'', phone:client.phone||'', whatsapp:client.whatsapp||'', country:client.country||'', city:client.city||'', nationality:client.nationality||'', date_of_birth:client.date_of_birth||'', gender:client.gender||'', status:client.status||'active', source:client.source||'', notes:client.notes||'' })
    else setForm({ first_name:'',last_name:'',email:'',phone:'',whatsapp:'',country:'',city:'',nationality:'',date_of_birth:'',gender:'',status:'active',source:'',notes:'' })
  }, [client])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  async function save() {
    if (!form.first_name || !form.last_name) { showToast('Nombre y apellido requeridos', 'warning'); return }
    setLoading(true)
    try {
      if (client) {
        const { error } = await supabase.from('clients').update(form).eq('id', client.id)
        if (error) throw error
        showToast('Cliente actualizado', 'success')
      } else {
        const { error } = await supabase.from('clients').insert({ ...form, assigned_agent_id: user?.id })
        if (error) throw error
        showToast('Cliente creado', 'success')
      }
      onSaved()
      onClose()
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={client ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={loading}>Guardar</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre *" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Nombre" />
        <Input label="Apellido *" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Apellido" />
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        <Input label="Teléfono" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 800 000 0000" />
        <Input label="WhatsApp" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+1 800 000 0000" />
        <div>
          <label className="form-label">País</label>
          <select className="form-input" value={form.country} onChange={e => set('country', e.target.value)}>
            <option value="">Seleccionar...</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Ciudad" value={form.city} onChange={e => set('city', e.target.value)} />
        <Input label="Nacionalidad" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
        <Input label="Fecha de nacimiento" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
        <div>
          <label className="form-label">Género</label>
          <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">-</option><option value="male">Masculino</option><option value="female">Femenino</option><option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Activo</option><option value="inactive">Inactivo</option><option value="vip">VIP</option><option value="prospect">Prospecto</option><option value="blocked">Bloqueado</option>
          </select>
        </div>
        <div>
          <label className="form-label">Fuente</label>
          <select className="form-input" value={form.source} onChange={e => set('source', e.target.value)}>
            <option value="">-</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="phone">Teléfono</option><option value="web">Web</option><option value="referral">Referido</option><option value="other">Otro</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="form-label">Notas</label>
          <textarea rows={3} className="form-input resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas internas sobre el cliente..." />
        </div>
      </div>
    </Modal>
  )
}

// ─── CLIENT DETAIL VIEW ───────────────────────────────────────────────────────
function ClientDetail({ client, onBack, onEdit, onRefresh }) {
  const { showToast, navigate } = useApp()
  const [reservations, setReservations] = useState([])
  const [conversations, setConversations] = useState([])
  const [calls, setCalls] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [tab, setTab] = useState('reservations')
  const { user } = useApp()

  useEffect(() => {
    if (!client) return
    Promise.all([
      supabase.from('reservations').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('conversations').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('calls').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('notes').select('*, profiles(full_name)').eq('client_id', client.id).order('created_at', { ascending: false }),
    ]).then(([res, conv, calls, notes]) => {
      setReservations(res.data || [])
      setConversations(conv.data || [])
      setCalls(calls.data || [])
      setNotes(notes.data || [])
    })
  }, [client?.id])

  async function addNote() {
    if (!newNote.trim()) return
    const { error } = await supabase.from('notes').insert({ content: newNote, author_id: user?.id, client_id: client.id })
    if (!error) { setNewNote(''); onRefresh() }
  }

  const channelIcon = (ch) => ch === 'whatsapp' ? '🟢' : ch === 'instagram' ? '🟣' : '🔵'
  const callIcon = (s) => s === 'completed' ? '✅' : s === 'missed' ? '❌' : '📞'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-icon"><ChevronLeft className="w-4 h-4" /></button>
        <h2 className="text-lg font-bold flex-1">Perfil del Cliente</h2>
        <Button variant="secondary" size="sm" onClick={onEdit}><Edit3 className="w-3.5 h-3.5" /> Editar</Button>
        <Button size="sm" onClick={() => navigate('flights')}><BookOpen className="w-3.5 h-3.5" /> Nueva Reserva</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Profile card */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-5 text-center">
            <Avatar name={`${client.first_name} ${client.last_name}`} size="xl" />
            <div className="mt-3">
              {client.vip_level > 0 && <div className="flex justify-center mb-1">{Array.from({length:client.vip_level}).map((_,i)=><Star key={i} className="w-4 h-4 text-sb-gold fill-current" />)}</div>}
              <h3 className="text-base font-bold text-sb-text1">{client.first_name} {client.last_name}</h3>
              <p className="text-xs text-sb-text3">{client.client_code}</p>
              <div className="mt-2"><StatusBadge status={client.status} /></div>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold text-sb-text2 uppercase">Información de contacto</p>
            {client.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span className="text-sb-text1 truncate">{client.email}</span></div>}
            {client.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span>{client.phone}</span></div>}
            {client.whatsapp && <div className="flex items-center gap-2 text-sm"><span className="text-green-500 font-bold text-xs">WA</span><span>{client.whatsapp}</span></div>}
            {client.country && <div className="flex items-center gap-2 text-sm"><Globe className="w-4 h-4 text-sb-text3 flex-shrink-0" /><span>{client.city ? `${client.city}, ` : ''}{client.country}</span></div>}
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold text-sb-text2 uppercase">Estadísticas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-sb-accentlt rounded-lg">
                <p className="text-xl font-bold text-sb-accent">{client.total_reservations || 0}</p>
                <p className="text-[10px] text-sb-text3">Reservas</p>
              </div>
              <div className="text-center p-2 bg-sb-successlt rounded-lg">
                <p className="text-lg font-bold text-sb-success">${(client.total_spent||0).toLocaleString()}</p>
                <p className="text-[10px] text-sb-text3">Total gastado</p>
              </div>
            </div>
            {client.last_reservation_at && <p className="text-xs text-sb-text3">Última reserva: {new Date(client.last_reservation_at).toLocaleDateString('es-ES')}</p>}
          </div>

          {/* Notes */}
          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Notas internas</p>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
              {notes.map(n => (
                <div key={n.id} className="bg-sb-surface2 rounded-lg p-2">
                  <p className="text-xs text-sb-text1">{n.content}</p>
                  <p className="text-[10px] text-sb-text3 mt-1">{n.profiles?.full_name} · {new Date(n.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Agregar nota..." className="form-input text-xs flex-1" />
              <Button size="sm" onClick={addNote}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <div className="xl:col-span-3 card">
          <div className="tab-list px-5">
            {[{id:'reservations',label:`Reservas (${reservations.length})`},{id:'conversations',label:`Mensajes (${conversations.length})`},{id:'calls',label:`Llamadas (${calls.length})`}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={clsx('tab-item', tab === t.id && 'active')}>{t.label}</button>
            ))}
          </div>
          <div className="p-5">
            {tab === 'reservations' && (
              <div className="space-y-2">
                {reservations.length === 0 ? <p className="text-center py-8 text-sb-text3 text-sm">Sin reservas</p> :
                  reservations.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><p className="text-sm font-bold">{r.reservation_code}</p><StatusBadge status={r.status} /></div>
                        <p className="text-xs text-sb-text3">{r.origin} → {r.destination} · {r.departure_date}</p>
                      </div>
                      <p className="font-bold text-sm">${r.total_amount?.toLocaleString()}</p>
                    </div>
                  ))}
              </div>
            )}
            {tab === 'conversations' && (
              <div className="space-y-2">
                {conversations.length === 0 ? <p className="text-center py-8 text-sb-text3 text-sm">Sin conversaciones</p> :
                  conversations.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-lg">
                      <span className="text-lg">{channelIcon(c.channel)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{c.channel}</p>
                        <p className="text-xs text-sb-text3 truncate">{c.last_message_preview}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
              </div>
            )}
            {tab === 'calls' && (
              <div className="space-y-2">
                {calls.length === 0 ? <p className="text-center py-8 text-sb-text3 text-sm">Sin llamadas</p> :
                  calls.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-lg">
                      <span className="text-lg">{callIcon(c.status)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{c.direction} · {c.status}</p>
                        <p className="text-xs text-sb-text3">{c.phone_from} → {c.phone_to} · {c.duration_seconds}s</p>
                      </div>
                      <p className="text-xs text-sb-text3">{c.created_at && new Date(c.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN CLIENTS PAGE ────────────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [page, setPage] = useState(0)
  const PER_PAGE = 25

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('clients').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    q = q.range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)
    const { data } = await q
    setClients(data || [])
    setLoading(false)
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('clients_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const cols = [
    { key: 'name', label: 'Cliente', render: (_, r) => (
      <div className="flex items-center gap-3">
        <Avatar name={`${r.first_name} ${r.last_name}`} size="sm" />
        <div><p className="font-medium text-sm">{r.first_name} {r.last_name}</p><p className="text-xs text-sb-text3">{r.client_code}</p></div>
        {r.vip_level > 0 && <Star className="w-3.5 h-3.5 text-sb-gold fill-current" />}
      </div>
    )},
    { key: 'phone', label: 'Teléfono', render: (_, r) => <span className="text-sm">{r.phone || '—'}</span> },
    { key: 'email', label: 'Email', render: (_, r) => <span className="text-sm truncate block max-w-[180px]">{r.email || '—'}</span> },
    { key: 'country', label: 'País', render: v => <span className="text-sm">{v || '—'}</span> },
    { key: 'total_reservations', label: 'Reservas', render: v => <span className="font-semibold text-sm text-sb-accent">{v || 0}</span> },
    { key: 'total_spent', label: 'Total gastado', render: v => <span className="font-semibold text-sm">${(v||0).toLocaleString()}</span> },
    { key: 'status', label: 'Estado', render: v => <StatusBadge status={v} /> },
    { key: 'actions', label: '', render: (_, r) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button className="btn-icon" onClick={() => { setEditClient(r); setFormOpen(true) }}><Edit3 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ]

  if (selectedClient) return (
    <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)}
      onEdit={() => { setEditClient(selectedClient); setFormOpen(true) }}
      onRefresh={() => { load(); supabase.from('clients').select('*').eq('id', selectedClient.id).single().then(({data}) => data && setSelectedClient(data)) }} />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <SearchBar placeholder="Buscar por nombre, email, teléfono..." value={search} onChange={v => { setSearch(v); setPage(0) }} className="w-64" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-40">
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="vip">VIP</option>
            <option value="prospect">Prospectos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <Button onClick={() => { setEditClient(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="card overflow-hidden">
        <Table columns={cols} data={clients} loading={loading} onRowClick={setSelectedClient} emptyText="No se encontraron clientes" />
        {clients.length === PER_PAGE && (
          <div className="flex justify-center p-4 border-t border-sb-border gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(0, page-1))} disabled={page === 0}>← Anterior</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(page+1)}>Siguiente →</Button>
          </div>
        )}
      </div>

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} client={editClient}
        onSaved={() => { load(); if (editClient && selectedClient?.id === editClient.id) supabase.from('clients').select('*').eq('id', editClient.id).single().then(({data}) => data && setSelectedClient(data)) }} />
    </div>
  )
}
