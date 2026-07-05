import { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase, getProfile, onAuthChange, signOut } from '../lib/supabase'

const AppContext = createContext(null)

const initialState = {
  user: null, profile: null, isLoading: true, isAuthenticated: false,
  notifications: [], unreadCount: 0, sidebarOpen: true,
  currentModule: 'dashboard', toast: null,
  // Meta side panel
  metaPanelOpen: false,
  metaActiveConvId: null,
  selectedFlightCard: null,   // Flight offer selected to send to client
  selectedHotelCard: null,    // Hotel selected to send to client
  metaPanelTab: 'chat',       // 'chat' | 'flight' | 'hotel'
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':         return { ...state, isLoading: action.payload }
    case 'SET_USER':            return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false }
    case 'SET_PROFILE':         return { ...state, profile: action.payload }
    case 'SET_NOTIFICATIONS':   return { ...state, notifications: action.payload, unreadCount: action.payload.filter(n => !n.is_read).length }
    case 'TOGGLE_SIDEBAR':      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_MODULE':          return { ...state, currentModule: action.payload }
    case 'SHOW_TOAST':          return { ...state, toast: action.payload }
    case 'HIDE_TOAST':          return { ...state, toast: null }
    case 'LOGOUT':              return { ...initialState, isLoading: false }
    // Meta panel
    case 'TOGGLE_META_PANEL':   return { ...state, metaPanelOpen: !state.metaPanelOpen }
    case 'OPEN_META_PANEL':     return { ...state, metaPanelOpen: true, metaPanelTab: action.payload || 'chat' }
    case 'CLOSE_META_PANEL':    return { ...state, metaPanelOpen: false }
    case 'SET_META_CONV':       return { ...state, metaActiveConvId: action.payload }
    case 'SET_META_TAB':        return { ...state, metaPanelTab: action.payload }
    case 'SET_FLIGHT_CARD':     return { ...state, selectedFlightCard: action.payload, metaPanelOpen: true, metaPanelTab: 'flight' }
    case 'SET_HOTEL_CARD':      return { ...state, selectedHotelCard: action.payload, metaPanelOpen: true, metaPanelTab: 'hotel' }
    case 'CLEAR_FLIGHT_CARD':   return { ...state, selectedFlightCard: null, metaPanelTab: 'chat' }
    case 'CLEAR_HOTEL_CARD':    return { ...state, selectedHotelCard: null, metaPanelTab: 'chat' }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (event, session) => {
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })
        const { data: profile } = await getProfile(session.user.id)
        if (profile) dispatch({ type: 'SET_PROFILE', payload: profile })
        loadNotifications(session.user.id)
        supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', session.user.id)
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!state.user) return
    const channel = supabase.channel('notifications_global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.user.id}` },
        (payload) => {
          dispatch({ type: 'SET_NOTIFICATIONS', payload: [payload.new, ...state.notifications] })
          showToast(payload.new.title, 'info')
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [state.user?.id])

  async function loadNotifications(userId) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    if (data) dispatch({ type: 'SET_NOTIFICATIONS', payload: data })
  }

  function showToast(message, type = 'success', duration = 4000) {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type, id: Date.now() } })
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), duration)
  }

  function navigate(module) {
    dispatch({ type: 'SET_MODULE', payload: module })
    window.history.pushState({}, '', `/${module === 'dashboard' ? '' : module}`)
  }

  async function signOutUser() {
    await signOut()
    dispatch({ type: 'LOGOUT' })
  }

  // Send flight card to client via WhatsApp
  function sendFlightCard(offer, markup = 150) {
    dispatch({ type: 'SET_FLIGHT_CARD', payload: { offer, markup } })
  }

  // Send hotel card to client
  function sendHotelCard(hotel, room, rate, searchParams, markup = 150) {
    dispatch({ type: 'SET_HOTEL_CARD', payload: { hotel, room, rate, searchParams, markup } })
  }

  const value = {
    ...state, dispatch, showToast, navigate, signOutUser,
    loadNotifications: () => state.user && loadNotifications(state.user.id),
    sendFlightCard, sendHotelCard,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
