import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Input, Spinner, Avatar } from '../components/ui'
import { Settings, Zap, Key, Check, X, RefreshCw, Eye, EyeOff, Save, Globe, Mail, Phone, CreditCard, Calendar, MessageSquare, Plane, Hotel, ExternalLink, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const INTEGRATIONS_CONFIG = [
  {
    provider: 'duffel', name: 'Duffel Flights API', icon: Plane, color: 'text-sb-accent bg-sb-accentlt',
    description: 'Búsqueda y reserva de vuelos en tiempo real. Accede a +20 aerolíneas con tarifas GDS.',
    docsUrl: 'https://duffel.com/docs', signupUrl: 'https://app.duffel.com',
    fields: [{ key: 'token', label: 'API Token', placeholder: 'duffel_live_...', type: 'password', help: 'Obtén tu token en app.duffel.com → Access tokens' }],
    modeOptions: true,
  },
  {
    provider: 'hotelbeds', name: 'Hotelbeds API', icon: Hotel, color: 'text-orange-600 bg-orange-50',
    description: 'Inventario de más de 180,000 hoteles en 185 países con precios en tiempo real.',
    docsUrl: 'https://developer.hotelbeds.com', signupUrl: 'https://developer.hotelbeds.com',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxx', type: 'text', help: 'Clave API de Hotelbeds' },
      { key: 'secret', label: 'Secret', placeholder: 'xxxxxxxxxxxxxxxx', type: 'password', help: 'Secret de Hotelbeds para firma SHA256' },
    ],
    modeOptions: true,
  },
  {
    provider: 'meta_business', name: 'Meta Business Platform', icon: MessageSquare, color: 'text-blue-600 bg-blue-50',
    description: 'WhatsApp Business API, Instagram Direct y Facebook Messenger integrados nativamente.',
    docsUrl: 'https://developers.facebook.com', signupUrl: 'https://business.facebook.com',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAxxxxxxx...', type: 'password', help: 'Token permanente de Meta Business' },
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890', type: 'text', help: 'ID del número de WhatsApp Business' },
      { key: 'business_account_id', label: 'Business Account ID', placeholder: '1234567890', type: 'text', help: 'ID de la cuenta de WhatsApp Business' },
      { key: 'verify_token', label: 'Verify Token (Webhook)', placeholder: 'mi_token_secreto', type: 'text', help: 'Token de verificación del webhook. URL del webhook: /functions/v1/meta-webhook' },
    ],
    modeOptions: false,
  },
  {
    provider: 'twilio', name: 'Twilio Voice & SMS', icon: Phone, color: 'text-rose-600 bg-rose-50',
    description: 'Centro de llamadas VoIP, SMS y grabación de llamadas integrado en el softphone.',
    docsUrl: 'https://www.twilio.com/docs', signupUrl: 'https://www.twilio.com',
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxx', type: 'text' },
      { key: 'auth_token', label: 'Auth Token', placeholder: 'xxxxxxxxxxxxxxx', type: 'password' },
      { key: 'phone_number', label: 'Número Twilio', placeholder: '+15551234567', type: 'text', help: 'Número de teléfono con capacidad de voz' },
    ],
    modeOptions: true,
  },
  {
    provider: 'stripe', name: 'Stripe Payments', icon: CreditCard, color: 'text-violet-600 bg-violet-50',
    description: 'Procesamiento de pagos con tarjeta de crédito, débito y más de 135 monedas.',
    docsUrl: 'https://stripe.com/docs', signupUrl: 'https://dashboard.stripe.com',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'password' },
      { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', type: 'password' },
    ],
    modeOptions: true,
  },
  {
    provider: 'paypal', name: 'PayPal Payments', icon: CreditCard, color: 'text-blue-700 bg-blue-50',
    description: 'Pagos vía PayPal, transferencias y divisas múltiples.',
    docsUrl: 'https://developer.paypal.com', signupUrl: 'https://developer.paypal.com',
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'Axxxxxxx...', type: 'text' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'Exxxxxxx...', type: 'password' },
    ],
    modeOptions: true,
  },
  {
    provider: 'google_workspace', name: 'Google Workspace / Calendar', icon: Calendar, color: 'text-sb-danger bg-sb-dangerlt',
    description: 'Sincronización con Google Calendar, Gmail y gestión de eventos de reservas.',
    docsUrl: 'https://console.cloud.google.com', signupUrl: 'https://console.cloud.google.com',
    fields: [
      { key: 'client_id', label: 'OAuth Client ID', placeholder: 'xxxx.apps.googleusercontent.com', type: 'text', help: 'Crear en Google Cloud Console → APIs → Credenciales' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-...', type: 'password' },
      { key: 'redirect_uri', label: 'Redirect URI', placeholder: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/google/callback`, type: 'text' },
    ],
    modeOptions: false,
    note: 'Scopes requeridos: calendar.events, gmail.send',
  },
]

function IntegrationCard({ config, integration, onSave, onTest }) {
  const [creds, setCreds] = useState({})
  const [mode, setMode] = useState('sandbox')
  const [expanded, setExpanded] = useState(false)
  const [showSecrets, setShowSecrets] = useState({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { showToast } = useApp()

  useEffect(() => {
    if (integration) {
      setCreds(integration.credentials || {})
      setMode(integration.config?.mode || 'sandbox')
    }
  }, [integration])

  const isActive = integration?.is_active
  const hasCredentials = config.fields.every(f => creds[f.key])
  const { icon: Icon, color } = config

  async function save() {
    setSaving(true)
    try {
      const updateData = {
        credentials: creds,
        is_active: hasCredentials,
        config: { mode, ...(integration?.config || {}) },
        updated_at: new Date().toISOString(),
      }
      if (integration) {
        await supabase.from('integrations').update(updateData).eq('provider', config.provider)
      } else {
        await supabase.from('integrations').insert({ provider: config.provider, name: config.name, ...updateData })
      }
      showToast(`${config.name} guardado correctamente`, 'success')
      onSave()
    } catch(e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function test() {
    setTesting(true)
    await new Promise(r => setTimeout(r, 1500))
    if (hasCredentials) showToast(`${config.name} — Conexión simulada OK (usa credenciales reales para test real)`, 'success')
    else showToast('Completa las credenciales primero', 'warning')
    setTesting(false)
  }

  return (
    <div className={clsx('card transition-all', expanded && 'ring-2 ring-sb-accent/20')}>
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sb-text1">{config.name}</h3>
              <div className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', isActive ? 'bg-sb-successlt text-sb-success' : 'bg-slate-100 text-slate-500')}>
                <div className={clsx('w-1.5 h-1.5 rounded-full', isActive ? 'bg-sb-success' : 'bg-slate-400')} />
                {isActive ? 'Conectado' : 'Sin conectar'}
              </div>
              {mode && <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-semibold', mode==='production'||mode==='live' ? 'bg-sb-dangerlt text-sb-danger' : 'bg-sb-warninglt text-sb-warning')}>{mode==='production'||mode==='live' ? 'PRODUCCIÓN' : 'SANDBOX'}</span>}
            </div>
            <p className="text-xs text-sb-text3 mt-0.5 truncate">{config.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Documentación"><ExternalLink className="w-4 h-4" /></a>
            <button onClick={() => setExpanded(!expanded)} className={clsx('btn btn-sm', expanded ? 'btn-secondary' : 'btn-primary')}>
              {expanded ? 'Colapsar' : 'Configurar'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t border-sb-border space-y-4">
            {config.note && (
              <div className="flex items-start gap-2 bg-sb-accentlt rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-sb-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs text-sb-accent">{config.note}</p>
              </div>
            )}

            {config.modeOptions && (
              <div>
                <label className="form-label">Entorno</label>
                <div className="flex gap-2">
                  {['sandbox','production'].map(m => (
                    <button key={m} onClick={() => setMode(m)} className={clsx('px-4 py-2 rounded-lg text-xs font-semibold border transition-all capitalize', mode===m ? m==='production' ? 'bg-sb-danger text-white border-sb-danger' : 'bg-sb-warning text-white border-sb-warning' : 'bg-white border-sb-border text-sb-text2 hover:border-sb-accent')}>
                      {m === 'production' ? '🔴 Producción' : '🟡 Sandbox / Test'}
                    </button>
                  ))}
                </div>
                {mode === 'production' && <p className="text-xs text-sb-danger mt-1 font-medium">⚠️ Modo producción: se usarán credenciales reales y se realizarán cargos/reservas reales</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <div className="relative">
                    <input
                      type={f.type === 'password' && !showSecrets[f.key] ? 'password' : 'text'}
                      value={creds[f.key] || ''}
                      onChange={e => setCreds(c => ({...c, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      className="form-input pr-10"
                    />
                    {f.type === 'password' && (
                      <button type="button" onClick={() => setShowSecrets(s => ({...s, [f.key]: !s[f.key]}))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sb-text3 hover:text-sb-text1">
                        {showSecrets[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {f.help && <p className="text-[11px] text-sb-text3 mt-1">{f.help}</p>}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} loading={saving}>
                <Save className="w-4 h-4" /> Guardar configuración
              </Button>
              <Button variant="secondary" onClick={test} loading={testing}>
                <Zap className="w-4 h-4" /> Probar conexión
              </Button>
              <a href={config.signupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sb-accent hover:underline flex items-center gap-1">
                Registrarse en {config.name.split(' ')[0]} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { profile, user, showToast, dispatch } = useApp()
  const [form, setForm] = useState({ full_name: '', phone: '', department: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [newPw, setNewPw] = useState('')

  useEffect(() => { if (profile) setForm({ full_name: profile.full_name||'', phone: profile.phone||'', department: profile.department||'' }) }, [profile])

  async function saveProfile() {
    setSaving(true)
    const { data, error } = await supabase.from('profiles').update(form).eq('id', user?.id).select().single()
    setSaving(false)
    if (!error) { dispatch({ type: 'SET_PROFILE', payload: data }); showToast('Perfil actualizado', 'success') }
    else showToast(error.message, 'error')
  }

  async function changePassword() {
    if (!newPw || newPw.length < 8) { showToast('Mínimo 8 caracteres', 'warning'); return }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setChangingPw(false)
    if (!error) { showToast('Contraseña actualizada', 'success'); setNewPw('') }
    else showToast(error.message, 'error')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h3 className="font-bold text-sb-text1 mb-4">Información personal</h3>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="xl" />
          <div>
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-xs text-sb-text3">{profile?.email}</p>
            <p className="text-xs text-sb-text3 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="space-y-3">
          <Input label="Nombre completo" value={form.full_name} onChange={e => setForm(f => ({...f,full_name:e.target.value}))} />
          <Input label="Teléfono" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} />
          <Input label="Departamento" value={form.department} onChange={e => setForm(f => ({...f,department:e.target.value}))} />
        </div>
        <div className="mt-4">
          <Button onClick={saveProfile} loading={saving}><Save className="w-4 h-4" /> Guardar cambios</Button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sb-text1 mb-4">Seguridad</h3>
        <div className="space-y-4">
          <div>
            <label className="form-label">Nueva contraseña</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className="form-input" />
          </div>
          <Button onClick={changePassword} loading={changingPw} variant="secondary">Cambiar contraseña</Button>
        </div>

        <div className="mt-5 pt-5 border-t border-sb-border">
          <h4 className="text-xs font-bold text-sb-text2 uppercase mb-3">Sesión activa</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-sb-text3">Email</span><span className="font-medium">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-sb-text3">Proveedor</span><span className="font-medium capitalize">{user?.app_metadata?.provider || 'email'}</span></div>
            <div className="flex justify-between"><span className="text-sb-text3">Último acceso</span><span className="font-medium">{profile?.last_seen_at ? new Date(profile.last_seen_at).toLocaleString('es-ES') : '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { profile } = useApp()
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('integrations')

  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor'

  useEffect(() => { loadIntegrations() }, [])

  async function loadIntegrations() {
    setLoading(true)
    const { data } = await supabase.from('integrations').select('*').order('provider')
    setIntegrations(data || [])
    setLoading(false)
  }

  function getIntegration(provider) { return integrations.find(i => i.provider === provider) }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="tab-list">
        <button className={clsx('tab-item', tab==='integrations' && 'active')} onClick={() => setTab('integrations')}>🔌 Integraciones API</button>
        <button className={clsx('tab-item', tab==='profile' && 'active')} onClick={() => setTab('profile')}>👤 Mi perfil</button>
      </div>

      {tab === 'integrations' && (
        <>
          {!isAdmin && (
            <div className="card p-4 border-sb-warning/30 bg-sb-warninglt flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-sb-warning flex-shrink-0" />
              <p className="text-sm text-sb-warning">Solo los administradores pueden modificar integraciones.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <div className="col-span-2 flex justify-center py-12"><Spinner size="lg" /></div> :
              INTEGRATIONS_CONFIG.map(cfg => (
                <IntegrationCard key={cfg.provider} config={cfg} integration={getIntegration(cfg.provider)} onSave={loadIntegrations} onTest={() => {}} />
              ))}
          </div>

          {/* Supabase info */}
          <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 border-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white">Supabase Backend</p>
                <p className="text-xs text-slate-400">Base de datos + Edge Functions + Realtime</p>
              </div>
              <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400 font-bold">Conectado</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Proyecto', value: 'Skybridge Travel' },
                { label: 'Región', value: 'US East 1' },
                { label: 'Edge Functions', value: '6 desplegadas' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'profile' && <ProfileSettings />}
    </div>
  )
}
