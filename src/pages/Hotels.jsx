import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Button, Modal, Input, Spinner, StatusBadge } from '../components/ui'
import { Hotel, Search, Star, MapPin, Wifi, Coffee, Car, Waves, Dumbbell, AlertCircle, Check, ChevronDown, ChevronUp, Info, Users, X, Plus } from 'lucide-react'
import { clsx } from 'clsx'

// Hotelbeds destination codes for major cities
const HOTEL_DESTINATIONS = [
  { code: 'HAV', name: 'La Habana', country: 'Cuba', flag: '🇨🇺' },
  { code: 'VRA', name: 'Varadero', country: 'Cuba', flag: '🇨🇺' },
  { code: 'HOG', name: 'Holguín', country: 'Cuba', flag: '🇨🇺' },
  { code: 'MIA', name: 'Miami', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'NYC', name: 'Nueva York', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'LAX', name: 'Los Ángeles', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MCO', name: 'Orlando', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'LAS', name: 'Las Vegas', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MAD', name: 'Madrid', country: 'España', flag: '🇪🇸' },
  { code: 'BCN', name: 'Barcelona', country: 'España', flag: '🇪🇸' },
  { code: 'CDG', name: 'París', country: 'Francia', flag: '🇫🇷' },
  { code: 'LHR', name: 'Londres', country: 'Reino Unido', flag: '🇬🇧' },
  { code: 'ROM', name: 'Roma', country: 'Italia', flag: '🇮🇹' },
  { code: 'MXP', name: 'Milán', country: 'Italia', flag: '🇮🇹' },
  { code: 'AMS', name: 'Ámsterdam', country: 'Países Bajos', flag: '🇳🇱' },
  { code: 'MEX', name: 'Ciudad de México', country: 'México', flag: '🇲🇽' },
  { code: 'CUN', name: 'Cancún', country: 'México', flag: '🇲🇽' },
  { code: 'BOG', name: 'Bogotá', country: 'Colombia', flag: '🇨🇴' },
  { code: 'MDE', name: 'Medellín', country: 'Colombia', flag: '🇨🇴' },
  { code: 'LIM', name: 'Lima', country: 'Perú', flag: '🇵🇪' },
  { code: 'GRU', name: 'São Paulo', country: 'Brasil', flag: '🇧🇷' },
  { code: 'EZE', name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { code: 'SCL', name: 'Santiago', country: 'Chile', flag: '🇨🇱' },
  { code: 'SDQ', name: 'Santo Domingo', country: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'PUJ', name: 'Punta Cana', country: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'PTY', name: 'Panamá', country: 'Panamá', flag: '🇵🇦' },
  { code: 'DXB', name: 'Dubái', country: 'EAU', flag: '🇦🇪' },
  { code: 'NRT', name: 'Tokio', country: 'Japón', flag: '🇯🇵' },
  { code: 'SIN', name: 'Singapur', country: 'Singapur', flag: '🇸🇬' },
]

function DestSearch({ value, onChange }) {
  const [q, setQ] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleInput(e) {
    const val = e.target.value; setQ(val)
    if (val.length >= 1) { setResults(HOTEL_DESTINATIONS.filter(d => d.name.toLowerCase().includes(val.toLowerCase()) || d.country.toLowerCase().includes(val.toLowerCase()) || d.code.toLowerCase().includes(val.toLowerCase()))); setOpen(true) }
    else { setResults([]); setOpen(false) }
  }

  function select(d) { setQ(`${d.name}, ${d.country}`); onChange(d); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <label className="form-label">Destino</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-text3 pointer-events-none" />
        <input type="text" value={q} onChange={handleInput} onFocus={() => { if (!q) { setResults(HOTEL_DESTINATIONS.slice(0, 8)); setOpen(true) } else if (q.length >= 1) setOpen(true) }}
          placeholder="Ciudad o destino..." className="form-input pl-9" />
      </div>
      {open && results.length > 0 && (
        <div className="airport-dropdown max-h-64 overflow-y-auto">
          {results.map(d => (
            <div key={d.code} className="airport-option" onClick={() => select(d)}>
              <span className="text-xl">{d.flag}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-sb-text1">{d.name}</p>
                <p className="text-xs text-sb-text3">{d.country}</p>
              </div>
              <span className="text-xs font-bold text-sb-accent">{d.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StarRating({ n }) {
  return <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={clsx('w-3.5 h-3.5', i < n ? 'text-sb-gold fill-current' : 'text-sb-border')} />)}</div>
}

const AMENITY_ICONS = { wifi: Wifi, restaurant: Coffee, parking: Car, pool: Waves, gym: Dumbbell }

function HotelCard({ hotel, onBook, searchParams }) {
  const { sendHotelCard } = useApp()
  const [expanded, setExpanded] = useState(false)
  const minRate = hotel.rooms?.reduce((min, r) => { const p = parseFloat(r.rates?.[0]?.net || 0); return p < min ? p : min }, 99999)
  const currency = hotel.currency || 'USD'

  return (
    <div className="card hover:shadow-md transition-all">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-32 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-sb-accentlt to-blue-100 flex items-center justify-center">
          <Hotel className="w-10 h-10 text-sb-accent opacity-50" />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sb-text1">{hotel.name}</h3>
              <StarRating n={hotel.categoryCode?.replace('ST', '') || hotel.minRate?.length || 3} />
              <div className="flex items-center gap-1 mt-1 text-xs text-sb-text3">
                <MapPin className="w-3 h-3" />
                <span>{hotel.address?.content || hotel.destinationName}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {minRate < 99999 ? (
                <>
                  <p className="text-xs text-sb-text3">Desde</p>
                  <p className="text-2xl font-bold text-sb-accent">{minRate.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-sb-text3">{currency} / noche</p>
                </>
              ) : (
                <p className="text-sm text-sb-text3">Consultar precio</p>
              )}
            </div>
          </div>
          {/* Amenities */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {hotel.amenities?.slice(0, 4).map(a => (
              <span key={a} className="text-[10px] px-2 py-0.5 bg-sb-surface2 border border-sb-border rounded-full text-sb-text3">{a}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button size="sm" onClick={() => setExpanded(!expanded)} variant="secondary">
              {expanded ? 'Ocultar' : 'Ver habitaciones'} {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            {!expanded && minRate < 99999 && (
              <>
                <Button size="sm" onClick={() => onBook(hotel, hotel.rooms?.[0], hotel.rooms?.[0]?.rates?.[0])}>Reservar</Button>
                <button
                  onClick={() => sendHotelCard(hotel, hotel.rooms?.[0], hotel.rooms?.[0]?.rates?.[0], searchParams, 150)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500 text-green-600 text-xs font-semibold hover:bg-green-50 transition-all"
                  title="Envía tarjeta al cliente con tu precio + ganancia"
                >
                  <span>📤</span> Enviar a cliente
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Room types */}
      {expanded && (
        <div className="border-t border-sb-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-bold text-sb-text2 uppercase">Habitaciones disponibles</p>
          {hotel.rooms?.slice(0, 5).map((room, ri) => (
            <div key={ri} className="flex items-center gap-3 p-3 bg-sb-surface2 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-semibold text-sb-text1">{room.name}</p>
                {room.rates?.[0] && (
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-sb-text3 capitalize">{room.rates[0].boardName?.toLowerCase() || 'Solo alojamiento'}</span>
                    {room.rates[0].cancellationPolicies?.[0] && <span className="text-xs text-sb-success">✓ Cancelación gratuita</span>}
                  </div>
                )}
              </div>
              {room.rates?.[0] && (
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-sb-text1">{parseFloat(room.rates[0].net).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-sb-text3">{currency} / noche</p>
                  <div className="flex gap-1.5 mt-1">
                    <Button size="sm" onClick={() => onBook(hotel, room, room.rates[0])}>Reservar</Button>
                    <button
                      onClick={() => sendHotelCard(hotel, room, room.rates[0], searchParams, 150)}
                      className="px-2 py-1 rounded-lg border border-green-500 text-green-600 text-xs font-semibold hover:bg-green-50 transition-all"
                      title="Enviar tarjeta al cliente"
                    >📤</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HotelBookingModal({ hotel, room, rate, searchParams, open, onClose }) {
  const { showToast, user } = useApp()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [bookingRef, setBookingRef] = useState('')
  const [holder, setHolder] = useState({ name: '', surname: '', email: '', phone: '' })

  useEffect(() => {
    if (open) {
      supabase.from('clients').select('id,first_name,last_name,email,phone').order('first_name').limit(100).then(({ data }) => setClients(data || []))
    }
  }, [open])

  async function book() {
    if (!holder.name || !holder.surname) { showToast('Nombre del titular requerido', 'warning'); return }
    setLoading(true)
    try {
      // Create reservation first
      const nights = searchParams?.check_in && searchParams?.check_out
        ? Math.ceil((new Date(searchParams.check_out) - new Date(searchParams.check_in)) / (1000*60*60*24)) : 1
      const total = parseFloat(rate?.net || 0) * nights

      const { data: res } = await supabase.from('reservations').insert({
        client_id: selectedClient?.id || null, type: 'hotel',
        destination: searchParams?.destination?.name, departure_date: searchParams?.check_in,
        return_date: searchParams?.check_out, adults: searchParams?.adults || 2,
        total_amount: total, currency: hotel?.currency || 'USD',
        status: 'pending', assigned_agent_id: user?.id,
      }).select().single()

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-hotel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          rate_key: rate?.rateKey,
          hotel_name: hotel?.name, hotel_code: hotel?.code,
          check_in: searchParams?.check_in, check_out: searchParams?.check_out,
          holder: { name: holder.name, surname: holder.surname },
          rooms: [{ paxes: [{ roomId: 1, type: 'AD', name: holder.name, surname: holder.surname }] }],
          reservation_id: res?.id,
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al reservar')
      setBookingRef(data.booking?.reference || data.booking?.clientReference)
      setStep(2)
    } catch (err) { showToast(err.message, 'error') }
    finally { setLoading(false) }
  }

  if (!hotel) return null
  const nights = searchParams?.check_in && searchParams?.check_out
    ? Math.ceil((new Date(searchParams.check_out) - new Date(searchParams.check_in)) / (1000*60*60*24)) : 1
  const total = parseFloat(rate?.net || 0) * nights

  return (
    <Modal open={open} onClose={onClose} title="Reservar Hotel" size="md">
      {step === 1 ? (
        <div className="space-y-5">
          <div className="bg-sb-accentlt border border-sb-accent/20 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sb-text1">{hotel.name}</p>
                <p className="text-sm text-sb-text3">{room?.name} · {rate?.boardName || 'Solo alojamiento'}</p>
                <p className="text-xs text-sb-text3 mt-1">{searchParams?.check_in} → {searchParams?.check_out} · {nights} noche(s)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-sb-accent">{total.toLocaleString()} {hotel.currency || 'USD'}</p>
                <p className="text-xs text-sb-text3">Total</p>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Asociar a cliente (opcional)</label>
            <select className="form-input" onChange={e => {
              const c = clients.find(cl => cl.id === e.target.value)
              setSelectedClient(c || null)
              if (c) setHolder({ name: c.first_name, surname: c.last_name, email: c.email || '', phone: c.phone || '' })
            }}>
              <option value="">— Sin asociar —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre del titular *" value={holder.name} onChange={e => setHolder(h => ({...h, name: e.target.value}))} />
            <Input label="Apellido *" value={holder.surname} onChange={e => setHolder(h => ({...h, surname: e.target.value}))} />
            <Input label="Email" type="email" value={holder.email} onChange={e => setHolder(h => ({...h, email: e.target.value}))} />
            <Input label="Teléfono" value={holder.phone} onChange={e => setHolder(h => ({...h, phone: e.target.value}))} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={book} loading={loading}><Check className="w-4 h-4" /> Confirmar Reserva</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-sb-successlt rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-sb-success" />
          </div>
          <h3 className="text-xl font-bold mb-2">¡Hotel Reservado!</h3>
          <p className="text-sb-text3 mb-1">Referencia: <span className="font-mono font-bold text-sb-text1">{bookingRef}</span></p>
          <p className="text-sm text-sb-text3 mb-6">La confirmación está disponible en Reservas</p>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      )}
    </Modal>
  )
}

export default function Hotels() {
  const { showToast } = useApp()
  const [destination, setDestination] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState(2)
  const [rooms, setRooms] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hotels, setHotels] = useState([])
  const [filtered, setFiltered] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState({ hotel: null, room: null, rate: null })
  const [bookOpen, setBookOpen] = useState(false)
  const [minStars, setMinStars] = useState(0)
  const [maxPrice, setMaxPrice] = useState(99999)

  async function search() {
    if (!destination) { showToast('Selecciona un destino', 'warning'); return }
    if (!checkIn || !checkOut) { showToast('Selecciona fechas de check-in y check-out', 'warning'); return }
    setLoading(true); setError(''); setHotels([]); setHasSearched(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-hotels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ destination_code: destination.code, check_in: checkIn, check_out: checkOut, adults, rooms })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.code === 'NOT_CONFIGURED' ? 'API de hoteles no configurada. Ve a Configuración → Integraciones y agrega las credenciales de Hotelbeds.' : data.error)
        return
      }
      setHotels(data.hotels || [])
      setFiltered(data.hotels || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let r = [...hotels]
    if (minStars > 0) r = r.filter(h => parseInt(h.categoryCode) >= minStars)
    r = r.filter(h => { const min = h.rooms?.reduce((m, rm) => { const p = parseFloat(rm.rates?.[0]?.net || 0); return p < m ? p : m }, 99999); return min <= maxPrice })
    setFiltered(r)
  }, [minStars, maxPrice, hotels])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-1"><DestSearch value={destination} onChange={setDestination} /></div>
          <div>
            <label className="form-label">Check-in</label>
            <input type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Check-out</label>
            <input type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="form-label">Huéspedes</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setAdults(Math.max(1, adults-1))} className="btn-icon border border-sb-border w-8 h-8 text-sm">-</button>
                <span className="flex-1 text-center font-semibold text-sm">{adults}</span>
                <button onClick={() => setAdults(Math.min(8, adults+1))} className="btn-icon border border-sb-border w-8 h-8 text-sm">+</button>
              </div>
            </div>
            <div>
              <label className="form-label">Habitaciones</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setRooms(Math.max(1, rooms-1))} className="btn-icon border border-sb-border w-8 h-8 text-sm">-</button>
                <span className="flex-1 text-center font-semibold text-sm">{rooms}</span>
                <button onClick={() => setRooms(Math.min(5, rooms+1))} className="btn-icon border border-sb-border w-8 h-8 text-sm">+</button>
              </div>
            </div>
          </div>
          <Button onClick={search} loading={loading} size="lg">
            <Search className="w-4 h-4" /> Buscar Hoteles
          </Button>
        </div>
      </div>

      {error && (
        <div className="card border-sb-danger/30 bg-sb-dangerlt p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-sb-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sb-danger text-sm">Error</p>
            <p className="text-sm text-sb-danger/80">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card p-12 flex flex-col items-center gap-4">
          <Hotel className="w-10 h-10 text-sb-accent animate-pulse" />
          <p className="font-semibold">Buscando hoteles disponibles...</p>
          <p className="text-sb-text3 text-sm">Consultando Hotelbeds en tiempo real</p>
        </div>
      )}

      {!loading && hasSearched && hotels.length === 0 && !error && (
        <div className="card p-12 text-center">
          <Hotel className="w-12 h-12 text-sb-text3 mx-auto mb-3" />
          <p className="font-semibold">No se encontraron hoteles disponibles</p>
          <p className="text-sb-text3 text-sm mt-1">Prueba con otras fechas o destino</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex gap-5">
          <div className="w-52 flex-shrink-0 space-y-4">
            <div className="card p-4">
              <p className="text-sm font-bold mb-3">Filtros</p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-sb-text2 mb-2">Estrellas mínimas</p>
                {[0,3,4,5].map(s => (
                  <label key={s} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="stars" checked={minStars === s} onChange={() => setMinStars(s)} />
                    <span className="text-xs">{s === 0 ? 'Todas' : `${s}+ estrellas`}</span>
                  </label>
                ))}
              </div>
              {hotels.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-sb-text2 mb-2">Precio máximo / noche</p>
                  <input type="range" min={0} max={1000} value={maxPrice === 99999 ? 1000 : maxPrice}
                    onChange={e => setMaxPrice(parseInt(e.target.value))} className="w-full" />
                  <p className="text-xs text-sb-text3">{maxPrice === 99999 ? 'Sin límite' : `Hasta $${maxPrice}`}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-sb-text3"><span className="font-bold text-sb-text1">{filtered.length}</span> hoteles en {destination?.name}</p>
            {filtered.map(h => (
              <HotelCard key={h.code} hotel={h} onBook={(hotel, room, rate) => { setBooking({ hotel, room, rate }); setBookOpen(true) }} searchParams={{ destination, check_in: checkIn, check_out: checkOut, adults, rooms }} />
            ))}
          </div>
        </div>
      )}

      <HotelBookingModal {...booking} searchParams={{ destination, check_in: checkIn, check_out: checkOut, adults, rooms }}
        open={bookOpen} onClose={() => { setBookOpen(false); setBooking({ hotel: null, room: null, rate: null }) }} />
    </div>
  )
}
