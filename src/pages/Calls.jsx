import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Avatar, Spinner, Badge } from '../components/ui'
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Volume2, VolumeX, Clock, User, ArrowDownLeft, ArrowUpRight, PhoneMissed, Circle, Pause, MoreVertical, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

function DialPad({ onDigit, onCall, onClear, number }) {
  const keys = [
    ['1','',''],['2','ABC',''],['3','DEF',''],
    ['4','GHI',''],['5','JKL',''],['6','MNO',''],
    ['7','PQRS',''],['8','TUV',''],['9','WXYZ',''],
    ['*','',''],['0','+',''],['#','',''],
  ]
  return (
    <div className="bg-sb-sidebar rounded-2xl p-5 flex flex-col items-center gap-4">
      {/* Display */}
      <div className="w-full text-center">
        <p className="text-white text-3xl font-light tracking-widest min-h-[44px]">{number || '\u00A0'}</p>
        <div className="h-0.5 w-full bg-white/10 mt-2" />
      </div>
      {/* Keys */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map(([main, sub], i) => (
          <button key={i} onClick={() => onDigit(main === '+' ? '+' : main)}
            className="dial-key group">
            <span className="text-white text-xl font-medium group-hover:scale-110 transition-transform">{main}</span>
            {sub && <span className="text-slate-500 text-[9px] tracking-widest">{sub}</span>}
          </button>
        ))}
      </div>
      {/* Call controls */}
      <div className="flex items-center gap-4">
        <button onClick={onClear} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 text-xl transition-colors">⌫</button>
        <button onClick={onCall}
          className="w-16 h-16 rounded-full bg-sb-success flex items-center justify-center shadow-lg shadow-sb-success/40 hover:bg-green-500 transition-all active:scale-95">
          <Phone className="w-7 h-7 text-white" />
        </button>
        <div className="w-12 h-12" />
      </div>
    </div>
  )
}

function ActiveCall({ call, onHangup, onMute, onHold, isMuted, isHeld, duration }) {
  const mins = Math.floor(duration / 60).toString().padStart(2, '0')
  const secs = (duration % 60).toString().padStart(2, '0')

  return (
    <div className="bg-sb-sidebar rounded-2xl p-5 flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-sb-success/20 flex items-center justify-center animate-pulse">
          <Avatar name={call.contact || call.number} size="xl" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl">{call.contact || call.number}</p>
          <p className="text-slate-400 text-sm">{call.number}</p>
          <p className="text-sb-success text-2xl font-mono mt-2">{mins}:{secs}</p>
          <p className="text-xs text-slate-500">{isHeld ? 'En espera' : isMuted ? 'Silenciado' : 'En llamada'}</p>
        </div>
      </div>
      {/* Controls */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { icon: isMuted ? MicOff : Mic, label: isMuted ? 'Activar' : 'Silenciar', action: onMute, active: isMuted, color: isMuted ? 'bg-sb-danger' : 'bg-white/10' },
          { icon: Pause, label: isHeld ? 'Reanudar' : 'Espera', action: onHold, active: isHeld, color: isHeld ? 'bg-sb-warning' : 'bg-white/10' },
          { icon: Circle, label: 'Grabar', action: () => {}, active: false, color: 'bg-white/10' },
        ].map(({ icon: Icon, label, action, active, color }) => (
          <button key={label} onClick={action} className={clsx('flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:opacity-80', color)}>
            <Icon className="w-5 h-5 text-white" />
            <span className="text-[10px] text-slate-300">{label}</span>
          </button>
        ))}
      </div>
      {/* Hangup */}
      <button onClick={onHangup}
        className="w-16 h-16 rounded-full bg-sb-danger flex items-center justify-center shadow-lg shadow-sb-danger/40 hover:bg-red-700 transition-all active:scale-95">
        <PhoneOff className="w-7 h-7 text-white" />
      </button>
    </div>
  )
}

function CallHistoryItem({ call }) {
  const icons = { incoming: ArrowDownLeft, outgoing: ArrowUpRight, missed: PhoneMissed, completed: Phone }
  const colors = { incoming: 'text-sb-success', outgoing: 'text-sb-accent', missed: 'text-sb-danger', completed: 'text-sb-text3' }
  const Icon = icons[call.status] || Phone
  const dur = call.duration_seconds || 0
  const durStr = dur > 60 ? `${Math.floor(dur/60)}m ${dur%60}s` : `${dur}s`

  return (
    <div className="flex items-center gap-3 py-3 border-b border-sb-border/50 last:border-b-0 hover:bg-sb-surface2 -mx-5 px-5 transition-colors">
      <div className={clsx('w-9 h-9 rounded-full bg-sb-surface2 flex items-center justify-center flex-shrink-0', colors[call.status])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sb-text1">{call.phone_from || call.phone_to || 'Desconocido'}</p>
        <p className="text-xs text-sb-text3 capitalize">{call.direction} · {call.status} {call.status === 'completed' && `· ${durStr}`}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-sb-text3">{call.created_at && new Date(call.created_at).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</p>
        <button className="text-xs text-sb-accent hover:underline mt-0.5">Rellamar</button>
      </div>
    </div>
  )
}

export default function Calls() {
  const { user, showToast } = useApp()
  const [dialNumber, setDialNumber] = useState('')
  const [activeCall, setActiveCall] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isHeld, setIsHeld] = useState(false)
  const [duration, setDuration] = useState(0)
  const [callHistory, setCallHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [twilioConfigured, setTwilioConfigured] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    loadHistory()
    checkTwilio()
  }, [])

  async function checkTwilio() {
    const { data } = await supabase.from('integrations').select('is_active').eq('provider', 'twilio').maybeSingle()
    setTwilioConfigured(data?.is_active || false)
  }

  async function loadHistory() {
    setLoadingHistory(true)
    const { data } = await supabase.from('calls').select('*').eq('agent_id', user?.id).order('created_at', { ascending: false }).limit(50)
    setCallHistory(data || [])
    setLoadingHistory(false)
  }

  function startCall(number) {
    if (!number) { showToast('Ingresa un número', 'warning'); return }
    const callObj = { number, contact: number, started_at: new Date().toISOString() }
    setActiveCall(callObj)
    setDuration(0)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    // Log call in DB
    supabase.from('calls').insert({ agent_id: user?.id, status: 'outgoing', direction: 'outbound', phone_to: number, started_at: new Date().toISOString(), provider: 'twilio' })
    showToast(`Llamando a ${number}...`, 'info')
  }

  async function hangup() {
    clearInterval(timerRef.current)
    if (activeCall) {
      await supabase.from('calls').update({ status: 'completed', duration_seconds: duration, ended_at: new Date().toISOString() }).eq('phone_to', activeCall.number).eq('agent_id', user?.id).order('created_at', { ascending: false }).limit(1)
      showToast(`Llamada finalizada · ${Math.floor(duration/60)}m ${duration%60}s`, 'success')
    }
    setActiveCall(null); setDuration(0); setIsMuted(false); setIsHeld(false)
    loadHistory()
  }

  const stats = {
    total: callHistory.length,
    completed: callHistory.filter(c => c.status === 'completed').length,
    missed: callHistory.filter(c => c.status === 'missed').length,
    avgDuration: callHistory.filter(c => c.duration_seconds).length > 0
      ? Math.round(callHistory.filter(c => c.duration_seconds).reduce((s, c) => s + c.duration_seconds, 0) / callHistory.filter(c => c.duration_seconds).length) : 0,
  }

  return (
    <div className="space-y-5">
      {!twilioConfigured && (
        <div className="card p-4 flex items-center gap-3 border-sb-warning/30 bg-sb-warninglt">
          <Phone className="w-5 h-5 text-sb-warning flex-shrink-0" />
          <p className="text-sm text-sb-warning flex-1">Twilio no configurado. Ve a <strong>Configuración → Integraciones</strong> para activar llamadas VoIP reales.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Softphone */}
        <div className="xl:col-span-1 space-y-4">
          {!activeCall ? (
            <DialPad
              number={dialNumber}
              onDigit={d => setDialNumber(prev => prev + d)}
              onClear={() => setDialNumber(prev => prev.slice(0, -1))}
              onCall={() => startCall(dialNumber)}
            />
          ) : (
            <ActiveCall call={activeCall} duration={duration} isMuted={isMuted} isHeld={isHeld}
              onHangup={hangup} onMute={() => setIsMuted(!isMuted)} onHold={() => setIsHeld(!isHeld)} />
          )}

          {/* Quick dial */}
          <div className="card p-4">
            <p className="text-xs font-bold text-sb-text2 uppercase mb-3">Marcación rápida</p>
            <div className="space-y-2">
              {[{ name: 'Soporte técnico', number: '+1 800 123 4567' }, { name: 'Aerolínea Iberia', number: '+34 91 587 8787' }, { name: 'Copa Airlines', number: '+507 217 2672' }].map(c => (
                <button key={c.number} onClick={() => { setDialNumber(c.number); startCall(c.number) }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-sb-surface2 border border-sb-border transition-all text-left">
                  <div className="w-8 h-8 bg-sb-accentlt rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-sb-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-sb-text3">{c.number}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: stats + history */}
        <div className="xl:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total llamadas', value: stats.total, color: 'text-sb-accent' },
              { label: 'Completadas', value: stats.completed, color: 'text-sb-success' },
              { label: 'Perdidas', value: stats.missed, color: 'text-sb-danger' },
              { label: 'Duración media', value: `${Math.floor(stats.avgDuration/60)}m ${stats.avgDuration%60}s`, color: 'text-sb-text1' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-sb-text3 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Call history */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Historial de llamadas</h3>
              <button onClick={loadHistory} className="btn-icon"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="px-5 pb-3">
              {loadingHistory ? <div className="flex justify-center py-8"><Spinner /></div> :
                callHistory.length === 0 ? <p className="text-center py-8 text-sb-text3 text-sm">Sin llamadas registradas</p> :
                  callHistory.map(c => <CallHistoryItem key={c.id} call={c} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
