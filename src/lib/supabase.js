import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: { params: { eventsPerSecond: 10 } }
})

// Auth helpers
export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (cb) => supabase.auth.onAuthStateChange(cb)

// Profile helpers
export const getProfile = (id) =>
  supabase.from('profiles').select('*').eq('id', id).single()

export const updateProfile = (id, data) =>
  supabase.from('profiles').update(data).eq('id', id)

// Generic CRUD
export const db = {
  from: (table) => supabase.from(table),
  
  select: (table, query = '*', filters = {}) => {
    let q = supabase.from(table).select(query)
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') q = q.eq(key, val)
    })
    return q
  },

  insert: (table, data) =>
    supabase.from(table).insert(data).select().single(),

  update: (table, id, data) =>
    supabase.from(table).update(data).eq('id', id).select().single(),

  delete: (table, id) =>
    supabase.from(table).delete().eq('id', id)
}

// Realtime subscriptions
export const subscribeToTable = (table, callback, filter = null) => {
  let channel = supabase.channel(`realtime_${table}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table,
      ...(filter ? { filter } : {})
    }, callback)
    .subscribe()
  return channel
}
