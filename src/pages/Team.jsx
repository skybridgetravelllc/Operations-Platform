import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Avatar, Badge, StatusBadge, Modal, Input, Spinner } from '../components/ui'
import { Users, Plus, Shield, Check, X, Edit3, UserCheck, UserX, Mail, Clock, RefreshCw, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

const ROLES = ['admin','supervisor','sales_agent','reservations_agent','customer_service','accounting','readonly']
const ROLE_LABELS = { admin:'Administrador', supervisor:'Supervisor', sales_agent:'Agente de Ventas', reservations_agent:'Agente de Reservas', customer_service:'Atención al Cliente', accounting:'Contabilidad', readonly:'Solo lectura' }
const ROLE_COLORS = { admin:'bg-sb-dangerlt text-sb-danger', supervisor:'bg-sb-infolt text-sb-info', sales_agent:'bg-sb-accentlt text-sb-accent', reservations_agent:'bg-sb-successlt text-sb-success', customer_service:'bg-sb-warninglt text-sb-warning', accounting:'bg-purple-50 text-purple-600', readonly:'bg-slate-100 text-slate-500' }

function RoleBadge({ role }) {
  return <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', ROLE_COLORS[role] || 'bg-slate-100 text-slate-500')}>{ROLE_LABELS[role] || role}</span>
}

function UserRow({ profile, onApprove, onDeny, onChangeRole, onToggleStatus }) {
  const [roleOpen, setRoleOpen] = useState(false)
  const isOnline = profile.last_seen_at && (new Date() - new Date(profile.last_seen_at)) < 5 * 60 * 1000
  const isPending = profile.status === 'pending'

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-sb-border/50 last:border-b-0 hover:bg-sb-surface2 transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar name={profile.full_name || profile.email} src={profile.avatar_url} size="md" />
        <div className={clsx('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', isOnline ? 'bg-sb-success' : 'bg-slate-300')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-sb-text1">{profile.full_name || 'Sin nombre'}</p>
          {isPending && <span className="text-[10px] bg-sb-warninglt text-sb-warning px-1.5 py-0.5 rounded-full font-bold animate-pulse">PENDIENTE</span>}
        </div>
        <p className="text-xs text-sb-text3 truncate">{profile.email}</p>
        <p className="text-xs text-sb-text3">{profile.phone || profile.department || ''}</p>
      </div>

      {/* Role */}
      <div className="relative">
        <button onClick={() => setRoleOpen(!roleOpen)} className="flex items-center gap-1.5">
          <RoleBadge role={profile.role} />
          <ChevronDown className="w-3 h-3 text-sb-text3" />
        </button>
        {roleOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-sb-border rounded-xl shadow-dropdown z-10 overflow-hidden">
            {ROLES.map(r => (
              <button key={r} onClick={() => { onChangeRole(profile.id, r); setRoleOpen(false) }}
                className={clsx('w-full text-left px-3 py-2 text-xs hover:bg-sb-surface2 transition-colors flex items-center gap-2', profile.role === r && 'bg-sb-accentlt')}>
                {profile.role === r && <Check className="w-3 h-3 text-sb-accent" />}
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <StatusBadge status={profile.status} />
      </div>

      {/* Last seen */}
      <p className="text-xs text-sb-text3 hidden lg:block w-28 flex-shrink-0">
        {profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleDateString('es-ES') : 'Nunca'}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isPending ? (
          <>
            <button onClick={() => onApprove(profile.id)} title="Aprobar acceso"
              className="flex items-center gap-1 px-3 py-1.5 bg-sb-success text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors">
              <Check className="w-3.5 h-3.5" /> Aprobar
            </button>
            <button onClick={() => onDeny(profile.id)} title="Denegar acceso"
              className="flex items-center gap-1 px-3 py-1.5 bg-sb-danger text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
              <X className="w-3.5 h-3.5" /> Denegar
            </button>
          </>
        ) : (
          <button onClick={() => onToggleStatus(profile.id, profile.status === 'active' ? 'inactive' : 'active')}
            className={clsx('p-2 rounded-lg transition-colors', profile.status === 'active' ? 'hover:bg-sb-dangerlt text-sb-danger' : 'hover:bg-sb-successlt text-sb-success')}>
            {profile.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function InviteModal({ open, onClose }) {
  const { showToast } = useApp()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales_agent')
  const [loading, setLoading] = useState(false)

  async function invite() {
    if (!email) { showToast('Email requerido', 'warning'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, { data: { role } })
      if (error) throw error
      showToast(`Invitación enviada a ${email}`, 'success'); onClose(); setEmail(''); setRole('sales_agent')
    } catch(e) {
      // Fallback: create profile record
      const { error: pe } = await supabase.from('profiles').insert({ email, role, status: 'pending', id: crypto.randomUUID() })
      if (!pe) showToast(`Perfil pendiente creado para ${email}`, 'success')
      else showToast('Para invitar usuarios activa el panel de Auth en Supabase', 'info')
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invitar Usuario" size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={invite} loading={loading}><Mail className="w-4 h-4" /> Enviar invitación</Button></>}>
      <div className="space-y-4">
        <Input label="Email corporativo" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agente@skybridge.com" />
        <div>
          <label className="form-label">Rol asignado</label>
          <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="bg-sb-accentlt rounded-xl p-3 text-xs text-sb-accent">
          <p className="font-semibold mb-1">Flujo de acceso Google:</p>
          <ol className="list-decimal ml-4 space-y-0.5">
            <li>Usuario inicia sesión con su cuenta Google</li>
            <li>Queda en estado "Pendiente de autorización"</li>
            <li>El administrador aprueba desde esta pantalla</li>
            <li>Usuario obtiene acceso al sistema</li>
          </ol>
        </div>
      </div>
    </Modal>
  )
}

export default function Team() {
  const { showToast, profile: myProfile } = useApp()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | active | pending | inactive
  const [inviteOpen, setInviteOpen] = useState(false)

  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'supervisor'

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setProfiles(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function approveUser(id) {
    const { error } = await supabase.from('profiles').update({ status: 'active', google_authorized: true }).eq('id', id)
    if (!error) { showToast('Usuario aprobado', 'success'); load() }
  }

  async function denyUser(id) {
    if (!confirm('¿Denegar acceso a este usuario?')) return
    const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', id)
    if (!error) { showToast('Acceso denegado', 'success'); load() }
  }

  async function changeRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (!error) { showToast('Rol actualizado', 'success'); load() }
  }

  async function toggleStatus(id, status) {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    if (!error) { showToast(`Usuario ${status === 'active' ? 'activado' : 'desactivado'}`, 'success'); load() }
  }

  const pending = profiles.filter(p => p.status === 'pending')
  const stats = { total: profiles.length, active: profiles.filter(p => p.status === 'active').length, pending: pending.length }

  return (
    <div className="space-y-5">
      {/* Pending alerts */}
      {pending.length > 0 && (
        <div className="card border-sb-warning/40 bg-sb-warninglt p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sb-warning/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-sb-warning" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sb-warning text-sm">{pending.length} usuario(s) pendiente(s) de autorización</p>
              <p className="text-xs text-sb-warning/80 mt-0.5">Han iniciado sesión con Google y esperan aprobación del administrador</p>
            </div>
            <button onClick={() => setFilter('pending')} className="text-xs text-sb-warning font-semibold hover:underline">Ver →</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {['all','active','pending','inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all', filter===f ? 'bg-sb-accent text-white' : 'bg-white border border-sb-border text-sb-text2 hover:border-sb-accent')}>
              {f === 'all' ? `Todos (${stats.total})` : f === 'active' ? `Activos (${stats.active})` : f === 'pending' ? `Pendientes (${stats.pending})` : 'Inactivos'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-icon border border-sb-border"><RefreshCw className="w-4 h-4" /></button>
          {isAdmin && <Button onClick={() => setInviteOpen(true)}><Plus className="w-4 h-4" /> Invitar usuario</Button>}
        </div>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-sb-accentlt rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-sb-accent" /></div>
          <div><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-sb-text3">Total usuarios</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-sb-successlt rounded-xl flex items-center justify-center"><UserCheck className="w-5 h-5 text-sb-success" /></div>
          <div><p className="text-xl font-bold">{stats.active}</p><p className="text-xs text-sb-text3">Activos</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-sb-warninglt rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-sb-warning" /></div>
          <div><p className="text-xl font-bold text-sb-warning">{stats.pending}</p><p className="text-xs text-sb-text3">Pendientes</p></div>
        </div>
      </div>

      {/* Roles guide */}
      <div className="card p-4">
        <p className="text-xs font-bold text-sb-text2 uppercase mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Guía de roles</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {ROLES.map(r => (
            <div key={r} className="flex items-center gap-2 p-2 rounded-lg bg-sb-surface2">
              <RoleBadge role={r} />
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-sb-border flex items-center gap-2">
          <span className="text-xs font-bold text-sb-text2 uppercase flex-1">Usuario</span>
          <span className="text-xs font-bold text-sb-text2 uppercase w-36">Rol</span>
          <span className="text-xs font-bold text-sb-text2 uppercase w-20">Estado</span>
          <span className="text-xs font-bold text-sb-text2 uppercase w-28 hidden lg:block">Última vez</span>
          <span className="text-xs font-bold text-sb-text2 uppercase w-24">Acciones</span>
        </div>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
          profiles.length === 0 ? <p className="text-center py-12 text-sb-text3">Sin usuarios</p> :
            profiles.map(p => (
              <UserRow key={p.id} profile={p}
                onApprove={approveUser} onDeny={denyUser}
                onChangeRole={changeRole} onToggleStatus={toggleStatus} />
            ))}
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
