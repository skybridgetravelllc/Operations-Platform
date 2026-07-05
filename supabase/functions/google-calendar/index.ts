import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers })

  try {
    const authHeader = req.headers.get("Authorization")!
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers })

    const url = new URL(req.url)
    const action = url.searchParams.get("action") || "list"

    // Get Google access token from profile
    const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).single()
    const googleToken = profile?.preferences?.google_access_token

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Google no conectado. Conecte su cuenta de Google en Configuración.", code: "NOT_CONNECTED" }), { status: 422, headers })
    }

    if (action === "list") {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`, {
        headers: { "Authorization": `Bearer ${googleToken}` }
      })
      const data = await res.json()
      return new Response(JSON.stringify({ events: data.items || [] }), { headers })
    }

    if (action === "create") {
      const body = await req.json()
      const { summary, description, start_datetime, end_datetime, attendees = [], reservation_id, location } = body

      const event = {
        summary,
        description,
        location,
        start: { dateTime: start_datetime, timeZone: "America/New_York" },
        end: { dateTime: end_datetime, timeZone: "America/New_York" },
        attendees: attendees.map((email: string) => ({ email })),
        reminders: { useDefault: false, overrides: [{ method: "email", minutes: 24 * 60 }, { method: "popup", minutes: 60 }] }
      }

      const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${googleToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event)
      })

      if (!res.ok) {
        const err = await res.json()
        return new Response(JSON.stringify({ error: "Error al crear evento", details: err }), { status: res.status, headers })
      }

      const created = await res.json()

      // Link event to reservation
      if (reservation_id) {
        await supabase.from("reservations").update({ metadata: { google_calendar_event_id: created.id } }).eq("id", reservation_id)
      }

      return new Response(JSON.stringify({ event: created, success: true }), { headers })
    }

    if (action === "delete") {
      const body = await req.json()
      const { event_id } = body
      const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${event_id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${googleToken}` }
      })
      return new Response(JSON.stringify({ success: res.ok }), { headers })
    }

    return new Response(JSON.stringify({ error: "Acción no soportada" }), { status: 400, headers })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
