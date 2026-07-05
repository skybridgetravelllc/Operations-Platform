import { X, Loader2, Check, AlertTriangle, Info, Search } from 'lucide-react'
import { clsx } from 'clsx'

// ─── BUTTON ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className, loading, ...props }) {
  const base = 'btn'
  const variants = { primary:'btn-primary', secondary:'btn-secondary', ghost:'btn-ghost', danger:'btn-danger', icon:'btn-icon' }
  const sizes = { sm:'btn-sm', md:'', lg:'btn-lg' }
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  )
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gray', className }) {
  const variants = {
    success:'badge-success', warning:'badge-warning', danger:'badge-danger',
    info:'badge-info', gray:'badge-gray', accent:'badge-accent', gold:'badge-gold'
  }
  return <span className={clsx(variants[variant] || 'badge-gray', className)}>{children}</span>
}

// ─── RESERVATION STATUS BADGE ────────────────────────────────────────────────
const STATUS_MAP = {
  new:       { label: 'Nueva',      variant: 'accent' },
  pending:   { label: 'Pendiente',  variant: 'warning' },
  quoted:    { label: 'Cotizada',   variant: 'info' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  issued:    { label: 'Emitida',    variant: 'success' },
  cancelled: { label: 'Cancelada',  variant: 'danger' },
  completed: { label: 'Completada', variant: 'gray' },
  refunded:  { label: 'Reembolsada',variant: 'warning' },
  active:    { label: 'Activo',     variant: 'success' },
  inactive:  { label: 'Inactivo',   variant: 'gray' },
  vip:       { label: 'VIP',        variant: 'gold' },
  prospect:  { label: 'Prospecto',  variant: 'accent' },
  blocked:   { label: 'Bloqueado',  variant: 'danger' },
}
export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, variant: 'gray' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
export function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-text3 pointer-events-none" />}
        <input className={clsx('form-input', Icon && 'pl-9', error && 'border-sb-danger focus:ring-sb-danger/30', className)} {...props} />
      </div>
      {error && <p className="text-xs text-sb-danger mt-1">{error}</p>}
    </div>
  )
}

// ─── SELECT ──────────────────────────────────────────────────────────────────
export function Select({ label, options, className, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={clsx('form-input bg-white', className)} {...props}>
        {options?.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── TEXTAREA ────────────────────────────────────────────────────────────────
export function Textarea({ label, rows = 3, className, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea rows={rows} className={clsx('form-input resize-none', className)} {...props} />
    </div>
  )
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return <Loader2 className={clsx(sizes[size], 'animate-spin text-sb-accent')} />
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, size = 'md', children, footer }) {
  if (!open) return null
  const sizes = { sm:'modal-sm', md:'modal-md', lg:'modal-lg', xl:'modal-xl', full:'max-w-6xl' }
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={clsx('modal animate-fade-in', sizes[size])}>
        {title && (
          <div className="modal-header">
            <h3 className="text-base font-semibold text-sb-text1">{title}</h3>
            <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ─── TABLE ───────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, loading, emptyText = 'No hay datos' }) {
  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {!data?.length ? (
            <tr><td colSpan={columns.length} className="text-center py-12 text-sb-text3">{emptyText}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} className={clsx(onRowClick && 'cursor-pointer')}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'accent' }) {
  const colors = {
    accent:  'text-sb-accent bg-sb-accentlt',
    success: 'text-sb-success bg-sb-successlt',
    warning: 'text-sb-warning bg-sb-warninglt',
    danger:  'text-sb-danger bg-sb-dangerlt',
    info:    'text-sb-info bg-sb-infolt',
    gold:    'text-sb-gold bg-sb-goldlt',
  }
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-2.5 rounded-xl', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', trend >= 0 ? 'bg-sb-successlt text-sb-success' : 'bg-sb-dangerlt text-sb-danger')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-sb-text1">{value}</p>
      <p className="text-sm font-medium text-sb-text1 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-sb-text3 mt-1">{subtitle}</p>}
    </div>
  )
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
export function SearchBar({ placeholder, value, onChange, className }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-text3" />
      <input
        type="text"
        placeholder={placeholder || 'Buscar...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={clsx('form-input pl-9 pr-4', className)}
      />
    </div>
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-sb-text3 mb-4" />}
      <p className="text-base font-semibold text-sb-text1 mb-1">{title}</p>
      {description && <p className="text-sm text-sb-text3 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 'md' }) {
  const sizes = { xs:'w-6 h-6 text-xs', sm:'w-8 h-8 text-xs', md:'w-9 h-9 text-sm', lg:'w-12 h-12 text-base', xl:'w-16 h-16 text-xl' }
  const initials = name ? name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() : '?'
  if (src) return <img src={src} alt={name} className={clsx('rounded-full object-cover', sizes[size])} />
  const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500']
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={clsx('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', sizes[size], color)}>
      {initials}
    </div>
  )
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null
  const icons = { success: Check, error: X, warning: AlertTriangle, info: Info }
  const Icon = icons[toast.type] || Check
  return (
    <div className={clsx('toast', `toast-${toast.type || 'success'}`)}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{toast.message}</span>
    </div>
  )
}
