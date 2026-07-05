import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Avatar, Button, Input, Spinner, StatusBadge } from '../components/ui'
import { Send, Paperclip, Search, MoreVertical, Phone, User, BookOpen, Tag, RefreshCw, Circle, CheckCheck, Clock, MessageSquare, Instagram, Facebook, Filter } from 'lucide-react'
import { clsx } from 'clsx'

const CHANNELS = [
  { id: 'all', label: 'Todos', color: 'text-sb-text2' },
  { id: 'whatsapp', label: 'WhatsApp', color: 'text-green-500', bg: 'bg-green-500' },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-500', bg: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-600' },
]

function ChannelBadge({ channel }) {
  const colors = { whatsapp: 'bg-green-500', instagram: 'bg-gradient-to-br from-pink-500 to-purple-600', facebook: 'bg-blue-600' }
  const labels = { whatsapp: 'W', instagram: 'I', facebook: 'F' }
  return <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0', colors[channel] || 'bg-gray-400')}>{labels[channel] || '?'}</div>
}

function MsgBubble({ msg }) {
  const out = msg.direction === 'outbound'
  return (
    <div className={clsx('flex', out ? 'justify-end' : 'justify-start')}>
      <div className={clsx('msg-bubble', out ? 'outbound' : 'inbound')}>
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <div className={clsx('flex items-center gap-1 mt-1', out ? 'justify-end' : 'justify-start')}>
          <p className="text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
          {out && msg.status === 'read' && <CheckCheck className="w-3 h-3 opacity-60" />}
        </div>
      </div>
    </div>
  )
}

function ConvList({ conversations, selected, onSelect, loading }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!loading && conversations.length === 0 && (
        <div className="text-center py-12 text-sb-text3 text-sm">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Sin conversaciones</p>
        </div>
      )}
      {conversations.map(c => (
        <div key={c.id} onClick={() => onSelect(c)}
          className={clsx('flex items-center gap-3 px-3 py-3 border-b border-sb-border/50 cursor-pointer transition-all hover:bg-sb-surface2', selected?.id === c.id && 'bg-sb-accentlt border-l-2 border-l-sb-accent')}>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600">
              {(c.contact_name || c.contact_phone || '?')[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5">
              <ChannelBadge channel={c.channel} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className={clsx('text-sm font-semibold truncate', c.unread_count > 0 ? 'text-sb-text1' : 'text-sb-text2')}>{c.contact_name || c.contact_phone}</p>
              <p className="text-[10px] text-sb-text3 flex-shrink-0 ml-1">{c.last_message_at && new Date(c.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-sb-text3 truncate">{c.last_message_preview || 'Sin mensajes'}</p>
              {c.unread_count > 0 && (
                <span className="flex-shrink-0 ml-1 w-5 h-5 bg-sb-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center">{c.unread_count > 9 ? '9+' : c.unread_count}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatPanel({ conv }) {
  const { user, showToast } = useApp()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [integration, setIntegration] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!conv) return
    setLoading(true)
    supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => { setMessages(data || []); setLoading(false) })
    // Mark as read
    supabase.from('conversations').update({ unread_count: 0, is_read: true }).eq('id', conv.id)
    // Get integration config
    supabase.from('integrations').select('is_active,credentials,config').eq('provider', 'meta_business').maybeSingle()
      .then(({ data }) => setIntegration(data))
  }, [conv?.id])

  // Realtime messages
  useEffect(() => {
    if (!conv) return
    const ch = supabase.channel(`msgs_${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [conv?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim(); setText('')
    try {
      if (conv.channel === 'whatsapp' && integration?.is_active && conv.contact_phone) {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({
            action: 'send_whatsapp',
            conversation_id: conv.id,
            phone_number_id: integration.credentials?.phone_number_id,
            recipient: conv.contact_phone,
            message: content,
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al enviar')
      } else {
        // Save message locally (other channels or not connected)
        await supabase.from('messages').insert({ conversation_id: conv.id, direction: 'outbound', sender_id: user?.id, content, message_type: 'text', status: 'sent' })
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString(), last_message_preview: content }).eq('id', conv.id)
      }
    } catch(err) { showToast(err.message, 'error'); setText(content) }
    finally { setSending(false) }
  }

  if (!conv) return <div className="flex-1 flex items-center justify-center text-sb-text3"><div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Selecciona una conversación</p></div></div>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sb-border bg-white flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600">
            {(conv.contact_name || conv.contact_phone || '?')[0].toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5"><ChannelBadge channel={conv.channel} /></div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{conv.contact_name || conv.contact_phone}</p>
          <p className="text-xs text-sb-text3 capitalize">{conv.channel} · {conv.status}</p>
        </div>
        <div className="flex gap-1">
          <button className="btn-icon" title="Llamar"><Phone className="w-4 h-4" /></button>
          <button className="btn-icon"><MoreVertical className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-sb-surface2">
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> :
          messages.length === 0 ? <p className="text-center text-sb-text3 text-sm py-8">Sin mensajes aún</p> :
            messages.map(m => <MsgBubble key={m.id} msg={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-sb-border p-3 bg-white flex-shrink-0">
        {!integration?.is_active && conv.channel === 'whatsapp' && (
          <p className="text-xs text-sb-warning text-center mb-2">⚠️ Meta Business no configurado — mensajes guardados localmente</p>
        )}
        <div className="flex items-end gap-2">
          <button className="btn-icon flex-shrink-0"><Paperclip className="w-4 h-4" /></button>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Mensaje por ${conv.channel}...`} rows={2}
            className="flex-1 form-input resize-none text-sm"
          />
          <Button onClick={send} loading={sending} className="flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ClientSidebar({ conv }) {
  const { navigate } = useApp()
  const [client, setClient] = useState(null)
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    if (!conv?.client_id) { setClient(null); setReservations([]); return }
    supabase.from('clients').select('*').eq('id', conv.client_id).single().then(({ data }) => setClient(data))
    supabase.from('reservations').select('reservation_code,status,total_amount,destination').eq('client_id', conv.client_id).limit(5).then(({ data }) => setReservations(data || []))
  }, [conv?.client_id])

  if (!conv) return null

  return (
    <div className="w-64 border-l border-sb-border bg-white overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-sb-border">
        <p className="text-xs font-bold text-sb-text2 uppercase">Ficha del cliente</p>
      </div>
      {!client ? (
        <div className="p-4 text-center text-sm text-sb-text3">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Sin cliente asociado</p>
          <Button size="sm" className="mt-3" onClick={() => navigate('clients')}>
            <User className="w-3 h-3" /> Crear cliente
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="text-center">
            <Avatar name={`${client.first_name} ${client.last_name}`} size="lg" />
            <p className="font-bold mt-2">{client.first_name} {client.last_name}</p>
            <StatusBadge status={client.status} />
          </div>
          <div className="space-y-1.5 text-xs">
            {client.email && <p className="truncate text-sb-text3">{client.email}</p>}
            {client.phone && <p className="text-sb-text3">{client.phone}</p>}
            {client.country && <p className="text-sb-text3">{client.city ? `${client.city}, ` : ''}{client.country}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-sb-accentlt rounded-lg p-2"><p className="font-bold text-sb-accent">{client.total_reservations||0}</p><p className="text-[10px] text-sb-text3">Reservas</p></div>
            <div className="bg-sb-successlt rounded-lg p-2"><p className="font-bold text-sb-success text-xs">${(client.total_spent||0).toLocaleString()}</p><p className="text-[10px] text-sb-text3">Gastado</p></div>
          </div>
          {reservations.length > 0 && (
            <div>
              <p className="text-xs font-bold text-sb-text2 uppercase mb-2">Reservas recientes</p>
              {reservations.map(r => (
                <div key={r.reservation_code} className="flex items-center justify-between py-1.5 border-b border-sb-border/50 last:border-b-0">
                  <div><p className="text-xs font-mono font-bold text-sb-accent">{r.reservation_code}</p><p className="text-[10px] text-sb-text3">{r.destination}</p></div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => navigate('clients')}><User className="w-3 h-3" /> Perfil</Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate('reservations')}><BookOpen className="w-3 h-3" /> Reservar</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Conversations() {
  const [channel, setChannel] = useState('all')
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('conversations').select('*').order('last_message_at', { ascending: false, nullsFirst: false }).limit(100)
    if (channel !== 'all') q = q.eq('channel', channel)
    if (search) q = q.or(`contact_name.ilike.%${search}%,contact_phone.ilike.%${search}%`)
    const { data } = await q
    setConvs(data || [])
    setLoading(false)
  }, [channel, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('convs_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const totalUnread = convs.reduce((s, c) => s + (c.unread_count || 0), 0)

  return (
    <div className="h-[calc(100vh-60px-48px)] flex gap-0 -m-6 mt-0">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 border-r border-sb-border bg-white flex flex-col">
        <div className="p-3 border-b border-sb-border space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sb-text1">Conversaciones</p>
            {totalUnread > 0 && <span className="text-xs bg-sb-accent text-white px-2 py-0.5 rounded-full font-bold">{totalUnread}</span>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sb-text3" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="form-input pl-8 text-xs py-2" />
          </div>
          <div className="flex gap-1">
            {CHANNELS.map(c => (
              <button key={c.id} onClick={() => setChannel(c.id)} className={clsx('flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all', channel === c.id ? 'bg-sb-accent text-white' : 'bg-sb-surface2 text-sb-text2 hover:bg-sb-border')}>
                {c.id === 'all' ? 'Todos' : c.label.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>
        <ConvList conversations={convs} selected={selected} onSelect={c => { setSelected(c); }} loading={loading} />
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel conv={selected} />
      </div>

      {/* Right: Client sidebar */}
      <ClientSidebar conv={selected} />
    </div>
  )
}
