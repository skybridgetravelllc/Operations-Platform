import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../context/AppContext'
import { Avatar } from '../ui'
import {
  MessageSquare, X, Send, Plane, Hotel, Search, ChevronDown,
  DollarSign, Check, Paperclip, RefreshCw, Plus, Edit3,
  Luggage, Clock, MapPin, Star, ArrowRight, Share2
} from 'lucide-react'
import { clsx } from 'clsx'

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
function fmtTime(dt) { return dt ? new Date(dt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--' }
function fmtDate(dt) { return dt ? new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '--' }
function fmtDur(iso) {
  if (!iso) return '--'
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return iso
  return `${m[1]||0}h ${m[2]||0}m`
}

// ─── CHANNEL BADGE ────────────────────────────────────────────────────────────
function ChannelDot({ channel }) {
  const c = { whatsapp: 'bg-green-500', instagram: 'bg-pink-500', facebook: 'bg-blue-600' }
  const l = { whatsapp: 'W', instagram: 'I', facebook: 'F' }
  return <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold', c[channel] || 'bg-gray-400')}>{l[channel]||'?'}</div>
}

// ─── FLIGHT CARD PREVIEW ──────────────────────────────────────────────────────
function FlightCardPreview({ offer, markup, onMarkupChange, onSend, sending }) {
  const slice = offer?.slices?.[0]
  const seg = slice?.segments?.[0]
  const airline = seg?.marketing_carrier
  const stops = (slice?.segments?.length || 1) - 1
  const apiPrice = parseFloat(offer?.total_amount || 0)
  const finalPrice = apiPrice + parseFloat(markup || 0)

  // WhatsApp card text
  function buildCardText() {
    return `✈️ *COTIZACIÓN DE VUELO*\n━━━━━━━━━━━━━━━━━━━━━\n🛫 *${slice?.origin?.iata_code} → ${slice?.destination?.iata_code}*\n✈️ ${airline?.name || 'Aerolínea'} ${seg?.marketing_carrier_flight_number || ''}\n📅 ${fmtDate(seg?.departing_at)} | ${fmtTime(seg?.departing_at)} → ${fmtTime(slice?.segments?.[slice.segments.length-1]?.arriving_at)}\n⏱️ ${fmtDur(slice?.duration)} | ${stops === 0 ? 'Vuelo directo' : `${stops} escala(s)`}\n🧳 Equipaje incluido\n💺 Clase: ${offer?.cabin_class || 'Economía'}\n━━━━━━━━━━━━━━━━━━━━━\n💵 *Precio: $${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD*\n━━━━━━━━━━━━━━━━━━━━━\n✅ Para confirmar, responda este mensaje.\n\n_Skybridge Travel ✈️_`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Card preview */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <p className="text-xs font-bold text-sb-text2 uppercase">Vista previa — tarjeta de vuelo</p>

        <div className="border-2 border-sb-accent/30 rounded-xl overflow-hidden bg-gradient-to-br from-sb-sidebar to-sb-sidebaractive">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
            <Plane className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Cotización de Vuelo</span>
          </div>
          {/* Route */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{slice?.origin?.iata_code || '---'}</p>
                <p className="text-slate-400 text-[10px]">{slice?.origin?.city_name || 'Origen'}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 px-3">
                <p className="text-slate-400 text-[10px]">{fmtDur(slice?.duration)}</p>
                <div className="flex items-center gap-1 w-full">
                  <div className="h-px flex-1 bg-white/20" />
                  <Plane className="w-3 h-3 text-white" />
                  <div className="h-px flex-1 bg-white/20" />
                </div>
                <p className={clsx('text-[10px] font-semibold', stops === 0 ? 'text-green-400' : 'text-yellow-400')}>
                  {stops === 0 ? 'Directo' : `${stops} escala${stops > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{slice?.destination?.iata_code || '---'}</p>
                <p className="text-slate-400 text-[10px]">{slice?.destination?.city_name || 'Destino'}</p>
              </div>
            </div>
            {/* Flight details */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                {airline?.logo_symbol_url
                  ? <img src={airline.logo_symbol_url} alt="" className="w-5 h-5 object-contain" />
                  : <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">{airline?.iata_code||'?'}</div>}
                <span className="text-slate-300 text-xs">{airline?.name} {seg?.marketing_carrier_flight_number}</span>
              </div>
              <p className="text-slate-300 text-xs">📅 {fmtDate(seg?.departing_at)}</p>
              <p className="text-slate-300 text-xs">🕐 {fmtTime(seg?.departing_at)} → {fmtTime(slice?.segments?.[slice.segments.length-1]?.arriving_at)}</p>
              <p className="text-slate-300 text-xs">💺 {offer?.cabin_class || 'Economía'} · 🧳 Equipaje incluido</p>
            </div>
          </div>
          {/* Price */}
          <div className="bg-sb-accent px-4 py-3 flex items-center justify-between">
            <span className="text-white text-xs font-semibold">Precio total</span>
            <span className="text-white text-xl font-bold">${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD</span>
          </div>
        </div>

        {/* Markup editor */}
        <div className="bg-sb-warninglt border border-sb-warning/30 rounded-xl p-3">
          <p className="text-xs font-bold text-sb-warning mb-2">💰 Precio al cliente (editable)</p>
          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sb-text3 text-[10px]">Precio API</p>
              <p className="font-bold text-sb-text1">${apiPrice.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sb-text3 text-[10px]">Tu ganancia</p>
              <div className="flex items-center gap-1">
                <span className="text-sb-text3">$</span>
                <input type="number" value={markup} onChange={e => onMarkupChange(parseFloat(e.target.value)||0)}
                  className="w-full font-bold text-sb-warning text-center bg-transparent focus:outline-none text-sm" min={0} />
              </div>
            </div>
            <div className="bg-sb-accent rounded-lg p-2 text-center">
              <p className="text-white text-[10px]">Cliente paga</p>
              <p className="font-bold text-white">${finalPrice.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[10px] text-sb-warning">✏️ Ajusta la ganancia. El cliente solo ve el precio final.</p>
        </div>

        {/* WhatsApp preview text */}
        <div className="bg-sb-surface2 rounded-xl p-3">
          <p className="text-xs font-bold text-sb-text2 mb-2">Mensaje WhatsApp</p>
          <pre className="text-xs text-sb-text3 whitespace-pre-wrap font-sans leading-relaxed">{buildCardText()}</pre>
        </div>
      </div>

      {/* Send button */}
      <div className="border-t border-sb-border p-3 flex gap-2">
        <button onClick={() => navigator.clipboard?.writeText(buildCardText()).then(() => {})}
          className="flex-shrink-0 btn btn-secondary btn-sm"><Paperclip className="w-3.5 h-3.5" /></button>
        <button onClick={() => onSend(buildCardText())} disabled={sending}
          className="flex-1 btn btn-primary text-sm">
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar al cliente</>}
        </button>
      </div>
    </div>
  )
}

// ─── HOTEL CARD PREVIEW ───────────────────────────────────────────────────────
function HotelCardPreview({ data, markup, onMarkupChange, onSend, sending }) {
  const { hotel, rate, searchParams } = data || {}
  const nights = searchParams?.check_in && searchParams?.check_out
    ? Math.ceil((new Date(searchParams.check_out) - new Date(searchParams.check_in)) / (1000*60*60*24)) : 1
  const apiPrice = parseFloat(rate?.net || 0) * nights
  const finalPrice = apiPrice + parseFloat(markup || 0)

  function buildCardText() {
    return `🏨 *COTIZACIÓN DE HOTEL*\n━━━━━━━━━━━━━━━━━━━━━\n🏨 *${hotel?.name || 'Hotel'}*\n📍 ${hotel?.address?.content || searchParams?.destination?.name || ''}\n${hotel?.categoryCode ? '⭐'.repeat(parseInt(hotel.categoryCode)||3) : ''}\n━━━━━━━━━━━━━━━━━━━━━\n📅 Check-in: ${fmtDate(searchParams?.check_in)}\n📅 Check-out: ${fmtDate(searchParams?.check_out)}\n🌙 ${nights} noche(s)\n👥 ${searchParams?.adults || 2} huésped(es)\n🛏️ ${hotel?.rooms?.[0]?.name || 'Habitación estándar'}\n🍽️ ${rate?.boardName || 'Solo alojamiento'}\n━━━━━━━━━━━━━━━━━━━━━\n💵 *Precio total: $${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD*\n━━━━━━━━━━━━━━━━━━━━━\n✅ Para confirmar, responda este mensaje.\n\n_Skybridge Travel ✈️_`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <p className="text-xs font-bold text-sb-text2 uppercase">Vista previa — tarjeta de hotel</p>

        <div className="border-2 border-orange-400/30 rounded-xl overflow-hidden bg-gradient-to-br from-orange-900 to-orange-800">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
            <Hotel className="w-4 h-4 text-white" /><span className="text-white text-xs font-bold uppercase tracking-wider">Cotización de Hotel</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-xl font-bold text-white mb-1">{hotel?.name || 'Hotel'}</p>
            {hotel?.categoryCode && <div className="flex mb-2">{Array.from({length:parseInt(hotel.categoryCode)||3}).map((_,i)=><Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current"/>)}</div>}
            <p className="text-orange-200 text-xs mb-3"><MapPin className="inline w-3 h-3 mr-1" />{hotel?.address?.content || searchParams?.destination?.name}</p>
            <div className="space-y-1.5">
              <p className="text-orange-200 text-xs">📅 {fmtDate(searchParams?.check_in)} → {fmtDate(searchParams?.check_out)}</p>
              <p className="text-orange-200 text-xs">🌙 {nights} noche(s) · 👥 {searchParams?.adults||2} huéspedes</p>
              <p className="text-orange-200 text-xs">🛏️ {hotel?.rooms?.[0]?.name || 'Habitación'}</p>
              <p className="text-orange-200 text-xs">🍽️ {rate?.boardName || 'Solo alojamiento'}</p>
            </div>
          </div>
          <div className="bg-orange-600 px-4 py-3 flex items-center justify-between">
            <span className="text-white text-xs font-semibold">Precio total ({nights} noche{nights>1?'s':''})</span>
            <span className="text-white text-xl font-bold">${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD</span>
          </div>
        </div>

        {/* Markup */}
        <div className="bg-sb-warninglt border border-sb-warning/30 rounded-xl p-3">
          <p className="text-xs font-bold text-sb-warning mb-2">💰 Precio al cliente (editable)</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sb-text3 text-[10px]">Precio API</p>
              <p className="font-bold">${apiPrice.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sb-text3 text-[10px]">Tu ganancia</p>
              <div className="flex items-center gap-1">
                <span className="text-sb-text3">$</span>
                <input type="number" value={markup} onChange={e => onMarkupChange(parseFloat(e.target.value)||0)}
                  className="w-full font-bold text-sb-warning text-center bg-transparent focus:outline-none text-sm" min={0} />
              </div>
            </div>
            <div className="bg-sb-accent rounded-lg p-2 text-center">
              <p className="text-white text-[10px]">Cliente paga</p>
              <p className="font-bold text-white">${finalPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-sb-surface2 rounded-xl p-3">
          <p className="text-xs font-bold text-sb-text2 mb-2">Mensaje WhatsApp</p>
          <pre className="text-xs text-sb-text3 whitespace-pre-wrap font-sans leading-relaxed">{buildCardText()}</pre>
        </div>
      </div>
      <div className="border-t border-sb-border p-3 flex gap-2">
        <button onClick={() => navigator.clipboard?.writeText(buildCardText())} className="flex-shrink-0 btn btn-secondary btn-sm"><Paperclip className="w-3.5 h-3.5" /></button>
        <button onClick={() => onSend(buildCardText())} disabled={sending} className="flex-1 btn btn-primary text-sm">
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar al cliente</>}
        </button>
      </div>
    </div>
  )
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function ChatTab({ convId, onSelectConv }) {
  const { user, showToast } = useApp()
  const [convs, setConvs] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [activeConv, setActiveConv] = useState(null)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef(null)
  const [integration, setIntegration] = useState(null)

  useEffect(() => {
    supabase.from('conversations').select('*').eq('status', 'open').order('last_message_at', { ascending: false }).limit(30)
      .then(({ data }) => setConvs(data || []))
    supabase.from('integrations').select('is_active,credentials,config').eq('provider', 'meta_business').maybeSingle()
      .then(({ data }) => setIntegration(data))
  }, [])

  useEffect(() => {
    if (convId) {
      const c = convs.find(cv => cv.id === convId)
      if (c) selectConv(c)
    }
  }, [convId, convs.length])

  async function selectConv(conv) {
    setActiveConv(conv)
    onSelectConv(conv.id)
    setLoadingMsgs(true)
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true }).limit(80)
    setMessages(data || [])
    setLoadingMsgs(false)
    supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!activeConv) return
    const ch = supabase.channel(`meta_side_${activeConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` },
        (p) => setMessages(prev => [...prev, p.new]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [activeConv?.id])

  async function send() {
    if (!text.trim() || !activeConv || sending) return
    setSending(true)
    const content = text.trim(); setText('')
    try {
      if (integration?.is_active && activeConv.contact_phone) {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ action: 'send_whatsapp', conversation_id: activeConv.id, phone_number_id: integration.credentials?.phone_number_id, recipient: activeConv.contact_phone, message: content })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else {
        await supabase.from('messages').insert({ conversation_id: activeConv.id, direction: 'outbound', sender_id: user?.id, content, message_type: 'text', status: 'sent' })
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString(), last_message_preview: content }).eq('id', activeConv.id)
      }
    } catch(e) { showToast(e.message, 'error'); setText(content) }
    finally { setSending(false) }
  }

  if (!activeConv) return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-sb-border">
        <p className="text-xs font-bold text-sb-text2 uppercase mb-2">Conversaciones activas</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-10 h-10 text-sb-text3 mb-2 opacity-30" /><p className="text-sm text-sb-text3">Sin conversaciones activas</p>
          </div>
        ) : convs.map(c => (
          <div key={c.id} onClick={() => selectConv(c)} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-sb-surface2 cursor-pointer border-b border-sb-border/40 transition-colors">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600">{(c.contact_name||c.contact_phone||'?')[0].toUpperCase()}</div>
              <div className="absolute -bottom-0.5 -right-0.5"><ChannelDot channel={c.channel} /></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sb-text1 truncate">{c.contact_name||c.contact_phone}</p>
              <p className="text-[10px] text-sb-text3 truncate">{c.last_message_preview||'...'}</p>
            </div>
            {c.unread_count > 0 && <span className="w-5 h-5 bg-sb-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{c.unread_count}</span>}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Conv header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sb-border bg-white flex-shrink-0">
        <button onClick={() => setActiveConv(null)} className="text-sb-text3 hover:text-sb-text1"><ArrowRight className="w-4 h-4 rotate-180" /></button>
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{(activeConv.contact_name||'?')[0].toUpperCase()}</div>
          <div className="absolute -bottom-0.5 -right-0.5"><ChannelDot channel={activeConv.channel} /></div>
        </div>
        <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{activeConv.contact_name||activeConv.contact_phone}</p><p className="text-[10px] text-sb-text3 capitalize">{activeConv.channel}</p></div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-sb-surface2">
        {loadingMsgs ? <div className="flex justify-center py-4"><RefreshCw className="w-4 h-4 animate-spin text-sb-text3" /></div> :
          messages.map(m => (
            <div key={m.id} className={clsx('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
              <div className={clsx('max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed', m.direction === 'outbound' ? 'bg-sb-accent text-white rounded-tr-sm' : 'bg-white text-sb-text1 rounded-tl-sm shadow-sm')}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={clsx('text-[9px] mt-0.5', m.direction === 'outbound' ? 'text-blue-200 text-right' : 'text-sb-text3')}>{new Date(m.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="border-t border-sb-border p-2 bg-white flex-shrink-0">
        {!integration?.is_active && <p className="text-[10px] text-sb-warning text-center mb-1">Meta no configurado — mensajes en local</p>}
        <div className="flex gap-1.5">
          <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Mensaje..." rows={2} className="flex-1 form-input resize-none text-xs py-1.5" />
          <button onClick={send} disabled={sending} className="btn btn-primary px-3 self-end">
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN META SIDE PANEL ─────────────────────────────────────────────────────
export default function MetaSidePanel() {
  const { metaPanelOpen, metaPanelTab, metaActiveConvId, selectedFlightCard, selectedHotelCard, dispatch, user, showToast } = useApp()
  const [flightMarkup, setFlightMarkup] = useState(150)
  const [hotelMarkup, setHotelMarkup] = useState(150)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (selectedFlightCard) setFlightMarkup(selectedFlightCard.markup ?? 150)
  }, [selectedFlightCard])

  useEffect(() => {
    if (selectedHotelCard) setHotelMarkup(selectedHotelCard.markup ?? 150)
  }, [selectedHotelCard])

  async function sendMessage(content) {
    if (!metaActiveConvId) { showToast('Selecciona una conversación primero en la pestaña Chat', 'warning'); dispatch({ type: 'SET_META_TAB', payload: 'chat' }); return }
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: integration } = await supabase.from('integrations').select('is_active,credentials').eq('provider', 'meta_business').maybeSingle()
      const { data: conv } = await supabase.from('conversations').select('*').eq('id', metaActiveConvId).single()

      if (integration?.is_active && conv?.contact_phone) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ action: 'send_whatsapp', conversation_id: metaActiveConvId, phone_number_id: integration.credentials?.phone_number_id, recipient: conv.contact_phone, message: content })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else {
        await supabase.from('messages').insert({ conversation_id: metaActiveConvId, direction: 'outbound', sender_id: user?.id, content, message_type: 'text', status: 'sent' })
        await supabase.from('conversations').update({ last_message_at: new Date().toISOString(), last_message_preview: content.slice(0, 80) }).eq('id', metaActiveConvId)
      }
      showToast('Tarjeta enviada al cliente ✅', 'success')
      if (metaPanelTab === 'flight') dispatch({ type: 'CLEAR_FLIGHT_CARD' })
      if (metaPanelTab === 'hotel') dispatch({ type: 'CLEAR_HOTEL_CARD' })
    } catch(e) { showToast(e.message, 'error') }
    finally { setSending(false) }
  }

  if (!metaPanelOpen) return null

  const TABS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'flight', label: 'Vuelo', icon: Plane, dot: !!selectedFlightCard },
    { id: 'hotel', label: 'Hotel', icon: Hotel, dot: !!selectedHotelCard },
  ]

  return (
    <div className="fixed right-0 top-[60px] bottom-0 w-[340px] bg-white border-l border-sb-border shadow-lg z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sb-border bg-sb-sidebar flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-white" />
        <span className="text-white text-xs font-bold flex-1">Meta Business</span>
        {metaActiveConvId && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-green-400 text-[10px]">Activo</span></div>}
        <button onClick={() => dispatch({ type: 'CLOSE_META_PANEL' })} className="text-slate-400 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sb-border flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => dispatch({ type: 'SET_META_TAB', payload: t.id })}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all relative', metaPanelTab === t.id ? 'text-sb-accent border-sb-accent' : 'text-sb-text3 border-transparent hover:text-sb-text1')}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.dot && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-sb-accent animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {metaPanelTab === 'chat' && (
          <ChatTab convId={metaActiveConvId} onSelectConv={id => dispatch({ type: 'SET_META_CONV', payload: id })} />
        )}
        {metaPanelTab === 'flight' && selectedFlightCard && (
          <FlightCardPreview offer={selectedFlightCard.offer} markup={flightMarkup} onMarkupChange={setFlightMarkup} onSend={sendMessage} sending={sending} />
        )}
        {metaPanelTab === 'flight' && !selectedFlightCard && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Plane className="w-12 h-12 text-sb-text3 mb-3 opacity-30" />
            <p className="font-semibold text-sb-text1 text-sm">Sin vuelo seleccionado</p>
            <p className="text-xs text-sb-text3 mt-1">Busca vuelos y haz clic en <strong>"Enviar a cliente"</strong> en cualquier resultado</p>
          </div>
        )}
        {metaPanelTab === 'hotel' && selectedHotelCard && (
          <HotelCardPreview data={selectedHotelCard} markup={hotelMarkup} onMarkupChange={setHotelMarkup} onSend={sendMessage} sending={sending} />
        )}
        {metaPanelTab === 'hotel' && !selectedHotelCard && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Hotel className="w-12 h-12 text-sb-text3 mb-3 opacity-30" />
            <p className="font-semibold text-sb-text1 text-sm">Sin hotel seleccionado</p>
            <p className="text-xs text-sb-text3 mt-1">Busca hoteles y haz clic en <strong>"Enviar a cliente"</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}
