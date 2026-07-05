import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { searchAirports } from '../data/airports'
import { Button, Badge, Modal, Spinner, Input, Select, Textarea } from '../components/ui'
import {
  Plane, ArrowLeftRight, Search, Filter, ChevronDown, ChevronUp,
  Clock, Luggage, Users, ArrowRight, Check, AlertCircle, Star,
  Wifi, Coffee, Tv, ChevronLeft, X, Plus, Calendar, Info
} from 'lucide-react'
import { clsx } from 'clsx'

// ─── AIRPORT SEARCH INPUT ────────────────────────────────────────────────────
function AirportInput({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.city || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    if (q.length >= 1) {
      setResults(searchAirports(q, 8))
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
  }

  function select(airport) {
    setQuery(`${airport.city} (${airport.code})`)
    onChange(airport)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-text3 pointer-events-none" />
        <input
          type="text" value={query} onChange={handleInput}
          onFocus={() => query.length >= 1 && setOpen(true)}
          placeholder={placeholder || 'Ciudad o aeropuerto...'}
          className="form-input pl-9 font-medium"
        />
        {value?.code && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sb-accent bg-sb-accentlt px-2 py-0.5 rounded">
            {value.code}
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="airport-dropdown max-h-72 overflow-y-auto">
          {results.map((a) => (
            <div key={a.code} className="airport-option" onClick={() => select(a)}>
              <span className="text-xl">{a.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sb-text1 text-sm">{a.code}</span>
                  <span className="text-sb-text1 text-sm font-medium truncate">{a.city}</span>
                </div>
                <p className="text-xs text-sb-text3 truncate">{a.airport}</p>
              </div>
              <span className="text-xs text-sb-text3 flex-shrink-0">{a.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FLIGHT DURATION FORMAT ───────────────────────────────────────────────────
function fmtDuration(iso) {
  if (!iso) return '--'
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return iso
  const h = parseInt(m[1] || 0), min = parseInt(m[2] || 0)
  return `${h}h ${min}m`
}
function fmtTime(dt) {
  if (!dt) return '--'
  return new Date(dt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── FLIGHT CARD ─────────────────────────────────────────────────────────────
function FlightCard({ offer, onBook }) {
  const { sendFlightCard } = useApp()
  const [expanded, setExpanded] = useState(false)
  const slice = offer.slices?.[0]
  const seg = slice?.segments?.[0]
  const airline = seg?.marketing_carrier
  const stops = slice?.segments?.length - 1 || 0

  const cabinConditions = offer.conditions || {}
  const refundable = cabinConditions?.refund_before_departure?.allowed

  return (
    <div className="card hover:shadow-md hover:border-sb-accent/30 transition-all">
      <div className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Airline */}
          <div className="flex items-center gap-2 w-36 flex-shrink-0">
            {airline?.logo_symbol_url ? (
              <img src={airline.logo_symbol_url} alt={airline.name} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-sb-accentlt rounded-lg flex items-center justify-center text-xs font-bold text-sb-accent">
                {airline?.iata_code || '?'}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-sb-text1 leading-tight">{airline?.name || 'Aerolínea'}</p>
              <p className="text-[10px] text-sb-text3">{seg?.marketing_carrier_flight_number}</p>
            </div>
          </div>

          {/* Times */}
          <div className="flex-1 flex items-center gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-sb-text1">{fmtTime(seg?.departing_at)}</p>
              <p className="text-xs text-sb-text3">{slice?.origin?.iata_code}</p>
              <p className="text-[10px] text-sb-text3">{fmtDate(seg?.departing_at)}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <p className="text-xs text-sb-text3">{fmtDuration(slice?.duration)}</p>
              <div className="flex items-center gap-1 w-full">
                <div className="h-[2px] flex-1 bg-sb-border rounded" />
                <Plane className="w-4 h-4 text-sb-accent transform rotate-0" />
                <div className="h-[2px] flex-1 bg-sb-border rounded" />
              </div>
              <p className={clsx('text-[10px] font-semibold', stops === 0 ? 'text-sb-success' : 'text-sb-warning')}>
                {stops === 0 ? 'Directo' : `${stops} escala${stops > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-sb-text1">{fmtTime(slice?.segments?.[slice.segments.length-1]?.arriving_at)}</p>
              <p className="text-xs text-sb-text3">{slice?.destination?.iata_code}</p>
              <p className="text-[10px] text-sb-text3">{fmtDate(slice?.segments?.[slice.segments.length-1]?.arriving_at)}</p>
            </div>
          </div>

          {/* Cabin + Baggage */}
          <div className="hidden lg:flex flex-col items-center gap-1 w-24 text-center flex-shrink-0">
            <span className="text-xs font-semibold text-sb-text2 capitalize">{offer.cabin_class || 'Economía'}</span>
            <div className="flex items-center gap-1 text-xs text-sb-text3">
              <Luggage className="w-3 h-3" />
              <span>{offer.available_services?.find(s=>s.type==='baggage')?.maximum_quantity || '1'} maleta</span>
            </div>
            {refundable !== undefined && (
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', refundable ? 'bg-sb-successlt text-sb-success' : 'bg-sb-dangerlt text-sb-danger')}>
                {refundable ? 'Reembolsable' : 'No reemb.'}
              </span>
            )}
          </div>

          {/* Price + Book */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-auto">
            <div className="text-right">
              <p className="text-2xl font-bold text-sb-text1">
                {parseFloat(offer.total_amount).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-sb-text3">{offer.total_currency} · por persona</p>
            </div>
            <Button onClick={() => onBook(offer)} className="w-full">
              <Plane className="w-3.5 h-3.5" /> Reservar
            </Button>
            {/* ── SEND TO CLIENT ── */}
            <button
              onClick={() => sendFlightCard(offer, 150)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500 text-green-600 text-xs font-semibold hover:bg-green-50 transition-all"
              title="Abre el panel Meta y pre-carga la tarjeta con +$150 de ganancia"
            >
              <span>📤</span> Enviar a cliente
            </button>
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-sb-accent hover:underline flex items-center gap-1">
              Detalles {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Expanded segments */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-sb-border space-y-3">
            {offer.slices?.map((sl, si) => (
              <div key={si}>
                {offer.slices.length > 1 && (
                  <p className="text-xs font-bold text-sb-text2 uppercase mb-2">{si === 0 ? 'Vuelo de ida' : 'Vuelo de regreso'}</p>
                )}
                {sl.segments?.map((s, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-sb-surface2 rounded-lg">
                    <div className="text-center w-20 flex-shrink-0">
                      <p className="font-bold text-sm">{fmtTime(s.departing_at)}</p>
                      <p className="text-xs text-sb-text3">{s.origin?.iata_code}</p>
                      <p className="text-[10px] text-sb-text3">{s.origin?.city_name}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center flex-1">
                      <p className="text-xs text-sb-text3">{fmtDuration(s.duration)}</p>
                      <div className="w-full h-px bg-sb-border my-1" />
                      <p className="text-xs font-medium">{s.marketing_carrier?.iata_code} {s.marketing_carrier_flight_number}</p>
                      <p className="text-[10px] text-sb-text3 capitalize">{s.passengers?.[0]?.cabin?.name || offer.cabin_class}</p>
                    </div>
                    <div className="text-center w-20 flex-shrink-0">
                      <p className="font-bold text-sm">{fmtTime(s.arriving_at)}</p>
                      <p className="text-xs text-sb-text3">{s.destination?.iata_code}</p>
                      <p className="text-[10px] text-sb-text3">{s.destination?.city_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {/* Fare conditions */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { label: 'Cambio vuelo', val: offer.conditions?.change_before_departure?.allowed },
                { label: 'Reembolso', val: offer.conditions?.refund_before_departure?.allowed },
                { label: 'Equipaje incluido', val: (offer.total_amount > 0) },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-sb-surface2">
                  <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', val ? 'bg-sb-successlt' : 'bg-sb-dangerlt')}>
                    {val ? <Check className="w-3 h-3 text-sb-success" /> : <X className="w-3 h-3 text-sb-danger" />}
                  </div>
                  <span className="text-xs text-sb-text2">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BOOKING MODAL ───────────────────────────────────────────────────────────
function BookingModal({ offer, searchParams, open, onClose, onBooked }) {
  const { user, profile, showToast } = useApp()
  const [step, setStep] = useState(1) // 1=passengers, 2=confirm, 3=done
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [reservationId, setReservationId] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [passengers, setPassengers] = useState([
    { id: '1', title: 'mr', given_name: '', family_name: '', born_on: '', email: '', phone: '', gender: 'male' }
  ])

  const total = offer ? parseFloat(offer.total_amount) * (searchParams?.adults || 1) : 0
  const slice = offer?.slices?.[0]
  const seg = slice?.segments?.[0]

  useEffect(() => {
    if (open) {
      supabase.from('clients').select('id,first_name,last_name,email,phone').order('first_name').limit(100)
        .then(({ data }) => setClients(data || []))
      // Init passengers based on adult count
      const count = searchParams?.adults || 1
      setPassengers(Array.from({ length: count }, (_, i) => ({
        id: String(i+1), title: 'mr', given_name: '', family_name: '',
        born_on: '', email: '', phone: '', gender: 'male'
      })))
    }
  }, [open])

  async function createReservation() {
    setLoading(true)
    try {
      const { data: res, error } = await supabase.from('reservations').insert({
        client_id: selectedClient?.id || null,
        type: 'flight',
        origin: slice?.origin?.iata_code,
        destination: slice?.destination?.iata_code,
        departure_date: seg?.departing_at?.split('T')[0],
        return_date: searchParams?.return_date || null,
        adults: searchParams?.adults || 1,
        children: searchParams?.children || 0,
        cabin_class: offer.cabin_class,
        total_amount: total,
        currency: offer.total_currency,
        status: 'pending',
        assigned_agent_id: user?.id,
        source: 'manual',
      }).select().single()
      if (error) throw error
      setReservationId(res.id)
      return res.id
    } finally {
      setLoading(false)
    }
  }

  async function bookFlight(resId) {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-flight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          offer_id: offer.id,
          passengers: passengers.map(p => ({
            id: p.id, title: p.title, given_name: p.given_name,
            family_name: p.family_name, born_on: p.born_on,
            email: p.email, phone_number: p.phone, gender: p.gender,
          })),
          reservation_id: resId,
          payment_amount: offer.total_amount,
          payment_currency: offer.total_currency,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al reservar')
      setOrderId(data.order?.id)
      setStep(3)
      showToast('¡Vuelo reservado exitosamente!', 'success')
      onBooked?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    const resId = reservationId || await createReservation()
    await bookFlight(resId)
  }

  function updatePassenger(idx, field, val) {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }

  if (!offer) return null

  return (
    <Modal open={open} onClose={onClose} title="Reservar Vuelo" size="lg">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {['Pasajeros', 'Confirmar', 'Completado'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              step > i+1 ? 'bg-sb-success text-white' : step === i+1 ? 'bg-sb-accent text-white' : 'bg-sb-border text-sb-text3')}>
              {step > i+1 ? <Check className="w-3.5 h-3.5" /> : i+1}
            </div>
            <span className={clsx('text-xs font-medium', step === i+1 ? 'text-sb-text1' : 'text-sb-text3')}>{s}</span>
            {i < 2 && <div className="h-px flex-1 bg-sb-border" />}
          </div>
        ))}
      </div>

      {/* Flight summary */}
      <div className="bg-sb-accentlt border border-sb-accent/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5 text-sb-accent" />
            <div>
              <p className="font-bold text-sb-text1">{slice?.origin?.iata_code} → {slice?.destination?.iata_code}</p>
              <p className="text-xs text-sb-text3">{seg?.marketing_carrier?.name} · {fmtTime(seg?.departing_at)} → {fmtTime(slice?.segments?.[slice.segments.length-1]?.arriving_at)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-sb-accent">{total.toLocaleString()} {offer.total_currency}</p>
            <p className="text-xs text-sb-text3">{searchParams?.adults} pasajero(s)</p>
          </div>
        </div>
      </div>

      {/* Step 1: Passengers */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Client selection */}
          <div>
            <label className="form-label">Asociar a cliente (opcional)</label>
            <select className="form-input" onChange={e => {
              const c = clients.find(cl => cl.id === e.target.value)
              setSelectedClient(c || null)
              if (c && passengers[0]) {
                updatePassenger(0, 'given_name', c.first_name)
                updatePassenger(0, 'family_name', c.last_name)
                updatePassenger(0, 'email', c.email || '')
                updatePassenger(0, 'phone', c.phone || '')
              }
            }}>
              <option value="">— Sin asociar —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.email}</option>)}
            </select>
          </div>

          {passengers.map((p, idx) => (
            <div key={idx} className="border border-sb-border rounded-xl p-4">
              <p className="text-sm font-bold text-sb-text1 mb-4">Pasajero {idx + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tratamiento</label>
                  <select className="form-input" value={p.title} onChange={e => updatePassenger(idx, 'title', e.target.value)}>
                    <option value="mr">Sr.</option><option value="mrs">Sra.</option><option value="ms">Srta.</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Género</label>
                  <select className="form-input" value={p.gender} onChange={e => updatePassenger(idx, 'gender', e.target.value)}>
                    <option value="male">Masculino</option><option value="female">Femenino</option>
                  </select>
                </div>
                <Input label="Nombre" value={p.given_name} onChange={e => updatePassenger(idx, 'given_name', e.target.value)} placeholder="Como en el pasaporte" />
                <Input label="Apellido" value={p.family_name} onChange={e => updatePassenger(idx, 'family_name', e.target.value)} placeholder="Como en el pasaporte" />
                <Input label="Fecha de nacimiento" type="date" value={p.born_on} onChange={e => updatePassenger(idx, 'born_on', e.target.value)} />
                <Input label="Email" type="email" value={p.email} onChange={e => updatePassenger(idx, 'email', e.target.value)} />
                <Input label="Teléfono" value={p.phone} onChange={e => updatePassenger(idx, 'phone', e.target.value)} placeholder="+1 800 000 0000" />
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button onClick={() => {
              const valid = passengers.every(p => p.given_name && p.family_name && p.born_on)
              if (!valid) { showToast('Completa todos los datos de pasajeros', 'warning'); return }
              setStep(2)
            }}>Continuar →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="border border-sb-border rounded-xl divide-y divide-sb-border">
            {passengers.map((p, i) => (
              <div key={i} className="px-4 py-3 flex justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.given_name} {p.family_name}</p>
                  <p className="text-xs text-sb-text3">{p.email} · Nac: {p.born_on}</p>
                </div>
                <span className="text-xs text-sb-text3 capitalize">{p.title}</span>
              </div>
            ))}
          </div>

          <div className="bg-sb-surface2 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-sb-text2">Subtotal vuelo</span><span className="font-medium">{offer.base_amount} {offer.total_currency}</span></div>
            <div className="flex justify-between text-sm"><span className="text-sb-text2">Tasas e impuestos</span><span className="font-medium">{offer.tax_amount} {offer.total_currency}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-sb-border pt-2"><span>Total</span><span className="text-sb-accent">{total.toLocaleString()} {offer.total_currency}</span></div>
          </div>

          <div className="bg-sb-warninglt border border-sb-warning/20 rounded-xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-sb-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-sb-warning">Al confirmar se procederá el cargo en balance Duffel. Esta acción emite el ticket con la aerolínea.</p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStep(1)}>← Atrás</Button>
            <Button onClick={handleConfirm} loading={loading}>
              <Check className="w-4 h-4" /> Confirmar y Reservar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-sb-successlt rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-sb-success" />
          </div>
          <h3 className="text-xl font-bold text-sb-text1 mb-2">¡Reserva Confirmada!</h3>
          <p className="text-sb-text3 mb-1">ID de orden Duffel: <span className="font-mono font-bold text-sb-text1">{orderId}</span></p>
          <p className="text-sb-text3 text-sm mb-6">Los tickets serán enviados al email del pasajero</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button onClick={() => { onClose(); }}>Ver en Reservas</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── MAIN FLIGHTS PAGE ───────────────────────────────────────────────────────
export default function Flights() {
  const { showToast } = useApp()
  const [tripType, setTripType] = useState('round') // one_way, round
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [cabinClass, setCabinClass] = useState('economy')
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [filters, setFilters] = useState({ maxStops: 99, maxPrice: 99999, airlines: [] })
  const [sortBy, setSortBy] = useState('price')

  // Derived airlines for filter
  const allAirlines = [...new Set(offers.map(o => o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name).filter(Boolean))]

  function swapAirports() {
    const tmp = origin; setOrigin(destination); setDestination(tmp)
  }

  async function search() {
    if (!origin || !destination) { showToast('Selecciona origen y destino', 'warning'); return }
    if (!departDate) { showToast('Selecciona la fecha de salida', 'warning'); return }
    if (tripType === 'round' && !returnDate) { showToast('Selecciona la fecha de regreso', 'warning'); return }

    setLoading(true); setError(''); setOffers([]); setHasSearched(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          origin: origin.code,
          destination: destination.code,
          departure_date: departDate,
          return_date: tripType === 'round' ? returnDate : undefined,
          adults, children, infants, cabin_class: cabinClass,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') {
          setError('API de vuelos no configurada. Ve a Configuración → Integraciones y agrega tu token de Duffel.')
        } else {
          setError(data.error || 'Error al buscar vuelos')
        }
        return
      }
      const sorted = (data.offers || []).sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
      setOffers(sorted)
      setFilteredOffers(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let result = [...offers]
    result = result.filter(o => {
      const stops = (o.slices?.[0]?.segments?.length || 1) - 1
      const price = parseFloat(o.total_amount)
      const airline = o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name
      if (stops > filters.maxStops) return false
      if (price > filters.maxPrice) return false
      if (filters.airlines.length > 0 && !filters.airlines.includes(airline)) return false
      return true
    })
    if (sortBy === 'price') result.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
    else if (sortBy === 'duration') result.sort((a, b) => (a.slices?.[0]?.duration || '').localeCompare(b.slices?.[0]?.duration || ''))
    setFilteredOffers(result)
  }, [filters, sortBy, offers])

  const minPrice = offers.length ? Math.floor(Math.min(...offers.map(o => parseFloat(o.total_amount)))) : 0
  const maxPriceMax = offers.length ? Math.ceil(Math.max(...offers.map(o => parseFloat(o.total_amount)))) : 9999

  return (
    <div className="space-y-5">
      {/* Search Form */}
      <div className="card">
        <div className="card-header">
          <div className="flex gap-2">
            {[{id:'one_way',label:'Solo ida'},{id:'round',label:'Ida y vuelta'}].map(t => (
              <button key={t.id} onClick={() => setTripType(t.id)}
                className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', tripType === t.id ? 'bg-sb-accent text-white' : 'bg-sb-surface2 text-sb-text2 hover:bg-sb-border')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-sb-text3">
            <Plane className="w-4 h-4" />
            <span>Búsqueda en tiempo real — Duffel GDS</span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
            {/* Origin */}
            <div className="xl:col-span-1">
              <AirportInput label="Origen" value={origin} onChange={setOrigin} placeholder="Ciudad de salida" />
            </div>
            {/* Swap */}
            <div className="hidden xl:flex justify-center items-end pb-1">
              <button onClick={swapAirports} className="btn-icon border border-sb-border hover:border-sb-accent hover:text-sb-accent transition-all">
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>
            {/* Destination */}
            <div className="xl:col-span-1">
              <AirportInput label="Destino" value={destination} onChange={setDestination} placeholder="Ciudad de llegada" />
            </div>
            {/* Dates */}
            <div className={clsx('grid gap-3', tripType === 'round' ? 'grid-cols-2' : 'grid-cols-1', 'xl:col-span-1')}>
              <div>
                <label className="form-label">Fecha salida</label>
                <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className="form-input" />
              </div>
              {tripType === 'round' && (
                <div>
                  <label className="form-label">Fecha regreso</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                    min={departDate || new Date().toISOString().split('T')[0]} className="form-input" />
                </div>
              )}
            </div>
            {/* Passengers + Class */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Pasajeros</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="btn-icon border border-sb-border">-</button>
                  <div className="flex items-center gap-1 flex-1 justify-center">
                    <Users className="w-4 h-4 text-sb-text3" />
                    <span className="text-sm font-semibold">{adults + children}</span>
                  </div>
                  <button onClick={() => setAdults(Math.min(9, adults + 1))} className="btn-icon border border-sb-border">+</button>
                </div>
              </div>
              <div>
                <label className="form-label">Clase</label>
                <select value={cabinClass} onChange={e => setCabinClass(e.target.value)} className="form-input">
                  <option value="economy">Economía</option>
                  <option value="premium_economy">Econ. Premium</option>
                  <option value="business">Negocios</option>
                  <option value="first">Primera</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={search} loading={loading} size="lg" className="px-8">
              <Search className="w-4 h-4" /> Buscar Vuelos
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-sb-danger/30 bg-sb-dangerlt p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-sb-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sb-danger text-sm">Error en la búsqueda</p>
            <p className="text-sm text-sb-danger/80 mt-1">{error}</p>
            {error.includes('Configuración') && (
              <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))} className="mt-2 text-xs text-sb-accent hover:underline">
                Ir a Configuración →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-12 flex flex-col items-center gap-4">
          <div className="relative">
            <Plane className="w-10 h-10 text-sb-accent animate-bounce" />
          </div>
          <p className="text-sb-text1 font-semibold">Buscando los mejores vuelos...</p>
          <p className="text-sb-text3 text-sm">Consultando Duffel GDS en tiempo real</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && offers.length === 0 && !error && (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 text-sb-text3 mx-auto mb-3" />
          <p className="font-semibold text-sb-text1">No se encontraron vuelos</p>
          <p className="text-sb-text3 text-sm mt-1">Prueba con otras fechas o rutas</p>
        </div>
      )}

      {filteredOffers.length > 0 && (
        <div className="flex gap-5">
          {/* Filters sidebar */}
          <div className="w-56 flex-shrink-0 space-y-4">
            <div className="card p-4">
              <p className="text-sm font-bold text-sb-text1 mb-3 flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</p>
              
              <div className="mb-4">
                <p className="text-xs font-semibold text-sb-text2 mb-2">Ordenar por</p>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="form-input text-xs">
                  <option value="price">Menor precio</option>
                  <option value="duration">Menor duración</option>
                </select>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-sb-text2 mb-2">Escalas</p>
                {[{v:0,l:'Solo directo'},{v:1,l:'Máx. 1 escala'},{v:99,l:'Todas'}].map(s => (
                  <label key={s.v} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="stops" checked={filters.maxStops === s.v} onChange={() => setFilters(f => ({...f, maxStops: s.v}))} />
                    <span className="text-xs text-sb-text2">{s.l}</span>
                  </label>
                ))}
              </div>

              {offers.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-sb-text2 mb-2">Precio máximo</p>
                  <input type="range" min={minPrice} max={maxPriceMax} value={filters.maxPrice === 99999 ? maxPriceMax : filters.maxPrice}
                    onChange={e => setFilters(f => ({...f, maxPrice: parseInt(e.target.value)}))} className="w-full" />
                  <p className="text-xs text-sb-text3 mt-1">Hasta: {(filters.maxPrice === 99999 ? maxPriceMax : filters.maxPrice).toLocaleString()} {offers[0]?.total_currency}</p>
                </div>
              )}

              {allAirlines.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-sb-text2 mb-2">Aerolíneas</p>
                  {allAirlines.map(a => (
                    <label key={a} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={filters.airlines.length === 0 || filters.airlines.includes(a)}
                        onChange={e => setFilters(f => ({ ...f, airlines: e.target.checked ? [...f.airlines.filter(x=>x!==a)] : [...f.airlines, a] }))} />
                      <span className="text-xs text-sb-text2 truncate">{a}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Offers list */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-sb-text3">
                <span className="font-bold text-sb-text1">{filteredOffers.length}</span> vuelos disponibles
                {origin && destination && <span> · {origin.code} → {destination.code}</span>}
              </p>
            </div>
            {filteredOffers.map(offer => (
              <FlightCard key={offer.id} offer={offer}
                onBook={(o) => { setSelectedOffer(o); setBookingOpen(true) }} />
            ))}
          </div>
        </div>
      )}

      <BookingModal
        offer={selectedOffer}
        searchParams={{ adults, children, infants, return_date: returnDate }}
        open={bookingOpen}
        onClose={() => { setBookingOpen(false); setSelectedOffer(null) }}
        onBooked={() => {}}
      />
    </div>
  )
}
