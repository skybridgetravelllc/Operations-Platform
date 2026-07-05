import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Avatar, Badge, StatusBadge, Modal, Input, Spinner } from '../components/ui'
import { Plus, CheckSquare, Clock, AlertCircle, X, Calendar, User, Tag, Filter, LayoutList, Columns } from 'lucide-react'
import { clsx } from 'clsx'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const PRIORITY_COLORS = { low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-50 text-blue-600', high: 'bg-amber-50 text-amber-600', urgent: 'bg-red-50 text-red-600' }
const PRIORITY_DOTS = { low: 'bg-slate-400', medium: 'bg-sb-accent', high: 'bg-sb-warning', urgent: 'bg-sb-danger' }
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']
const STATUS_LABELS = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada', cancelled: 'Cancelada' }

function TaskCard({ task, onUpdate, onDelete }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  return (
    <div className={clsx('card p-3 hover:shadow-md transition-all cursor-pointer', task.status === 'completed' && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <button onClick={() => onUpdate(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
          className={clsx('w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all', task.status === 'completed' ? 'bg-sb-success border-sb-success' : 'border-sb-border hover:border-sb-accent')}>
          {task.status === 'completed' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium', task.status === 'completed' && 'line-through text-sb-text3')}>{task.title}</p>
          {task.description && <p className="text-xs text-sb-text3 mt-0.5 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            {task.due_date && (
              <span className={clsx('text-[10px] flex items-center gap-0.5', overdue ? 'text-sb-danger font-semibold' : 'text-sb-text3')}>
                <Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit' })}
                {overdue && ' ⚠️'}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} className="btn-icon p-1 opacity-0 group-hover:opacity-100 flex-shrink-0"><X className="w-3 h-3" /></button>
      </div>
    </div>
  )
}

function KanbanColumn({ status, tasks, onUpdate, onDelete }) {
  const colors = { pending: 'border-t-slate-400', in_progress: 'border-t-sb-accent', completed: 'border-t-sb-success', cancelled: 'border-t-sb-danger' }
  return (
    <div className={clsx('flex-1 min-w-[220px] max-w-xs bg-sb-surface2 rounded-xl border-t-4', colors[status])}>
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-sb-text1">{STATUS_LABELS[status]}</span>
        <span className="w-6 h-6 rounded-full bg-sb-border flex items-center justify-center text-xs font-bold text-sb-text2">{tasks.length}</span>
      </div>
      <div className="px-3 pb-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        {tasks.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />)}
        {tasks.length === 0 && <p className="text-center py-6 text-sb-text3 text-xs">Sin tareas</p>}
      </div>
    </div>
  )
}

function TaskForm({ open, onClose, onSaved }) {
  const { user, showToast } = useApp()
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({ title:'', description:'', priority:'medium', status:'pending', assigned_to:'', due_date:'', tags:'' })

  useEffect(() => {
    if (open) {
      supabase.from('profiles').select('id,full_name').eq('status','active').then(({data}) => setAgents(data||[]))
      setForm(f => ({...f, assigned_to: user?.id || ''}))
    }
  }, [open])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  async function save() {
    if (!form.title) { showToast('El título es requerido', 'warning'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').insert({ ...form, created_by: user?.id, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [] })
      if (error) throw error
      showToast('Tarea creada', 'success'); onSaved(); onClose()
    } catch(e){ showToast(e.message,'error') } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Tarea" size="md"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={loading}>Crear Tarea</Button></>}>
      <div className="space-y-4">
        <Input label="Título *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="¿Qué hay que hacer?" />
        <div>
          <label className="form-label">Descripción</label>
          <textarea rows={3} className="form-input resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalles adicionales..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Prioridad</label>
            <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Estado inicial</label>
            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Asignar a</label>
            <select className="form-input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Fecha límite</label>
            <input type="datetime-local" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>
        <Input label="Etiquetas (separadas por coma)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="urgente, vuelo, cliente-vip" />
      </div>
    </Modal>
  )
}

export default function Tasks() {
  const { user } = useApp()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban') // kanban | list
  const [filter, setFilter] = useState('mine') // mine | all
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('tasks').select('*, profiles!assigned_to(full_name, avatar_url)').order('created_at', { ascending: false })
    if (filter === 'mine') q = q.or(`assigned_to.eq.${user?.id},created_by.eq.${user?.id}`)
    if (priorityFilter !== 'all') q = q.eq('priority', priorityFilter)
    const { data } = await q.limit(200)
    setTasks(data || [])
    setLoading(false)
  }, [filter, priorityFilter, user?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('tasks_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function updateTask(id, updates) {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function deleteTask(id) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const byStatus = (s) => tasks.filter(t => t.status === s)

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('mine')} className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filter==='mine' ? 'bg-sb-accent text-white' : 'bg-white border border-sb-border text-sb-text2 hover:border-sb-accent')}>Mis tareas</button>
          <button onClick={() => setFilter('all')} className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filter==='all' ? 'bg-sb-accent text-white' : 'bg-white border border-sb-border text-sb-text2 hover:border-sb-accent')}>Todas</button>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="form-input w-36 text-xs py-1.5">
            <option value="all">Toda prioridad</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')} className="btn-icon border border-sb-border">
            {view === 'kanban' ? <LayoutList className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
          </button>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Nueva Tarea</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pendientes', value: stats.pending, color: 'text-sb-text1' },
          { label: 'En progreso', value: stats.in_progress, color: 'text-sb-accent' },
          { label: 'Urgentes', value: stats.urgent, color: 'text-sb-danger' },
          { label: 'Vencidas', value: stats.overdue, color: 'text-sb-warning' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-sb-text3">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        view === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map(s => <KanbanColumn key={s} status={s} tasks={byStatus(s)} onUpdate={updateTask} onDelete={deleteTask} />)}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-sb-border">
              {tasks.length === 0 ? <p className="text-center py-12 text-sb-text3">Sin tareas</p> :
                tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-sb-surface2 group transition-colors">
                    <button onClick={() => updateTask(t.id, { status: t.status === 'completed' ? 'pending' : 'completed' })}
                      className={clsx('w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center', t.status === 'completed' ? 'bg-sb-success border-sb-success' : 'border-sb-border hover:border-sb-accent')}>
                      {t.status === 'completed' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>
                    <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOTS[t.priority])} />
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm font-medium', t.status === 'completed' && 'line-through text-sb-text3')}>{t.title}</p>
                      {t.description && <p className="text-xs text-sb-text3 truncate">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-sb-text3">
                      {t.due_date && <span className={clsx('flex items-center gap-1', new Date(t.due_date) < new Date() && t.status !== 'completed' && 'text-sb-danger font-semibold')}><Calendar className="w-3 h-3" />{new Date(t.due_date).toLocaleDateString('es-ES')}</span>}
                      {t.profiles && <div className="flex items-center gap-1"><Avatar name={t.profiles.full_name} size="xs" /><span className="hidden lg:block">{t.profiles.full_name}</span></div>}
                    </div>
                    <button onClick={() => deleteTask(t.id)} className="btn-icon p-1 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
            </div>
          </div>
        )
      )}

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </div>
  )
}
