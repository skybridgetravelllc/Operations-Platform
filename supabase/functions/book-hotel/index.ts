import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const HOTELBEDS_API = "https://api.test.hotelbeds.com"

Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers })

  try {
    const authHeader = req.headers.get("Authorization")!
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers })

    const body = await req.json()
    const { rate_key, hotel_name, hotel_code, check_in, check_out, holder, rooms, reservation_id } = body

    const { data: [integration] } = await supabase.from("integrations").select("credentials,is_active,config").eq("provider", "hotelbeds")
    if (!integration?.is_active || !integration?.credentials?.api_key) {
      return new Response(JSON.stringify({ error: "Hotelbeds API no configurada", code: "NOT_CONFIGURED" }), { status: 422, headers })
    }

    const { api_key, secret } = integration.credentials
    const baseUrl = integration.config?.mode === "production" ? "https://api.hotelbeds.com" : HOTELBEDS_API
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const hashInput = api_key + secret + timestamp
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput))
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const bookingBody = {
      holder,
      rooms: rooms.map((r: any) => ({ rateKey: rate_key, paxes: r.paxes })),
      clientReference: `SKY-${Date.now()}`,
      remark: "Reserva Skybridge Travel"
    }

    const res = await fetch(`${baseUrl}/hotel-api/v1/bookings`, {
      method: "POST",
      headers: {
        "Api-key": api_key,
        "X-Signature": signature,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingBody)
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: "Error al reservar hotel", details: err }), { status: res.status, headers })
    }

    const booking = await res.json()
    const b = booking.booking

    // Save to database
    if (reservation_id) {
      await supabase.from("hotel_bookings").insert({
        reservation_id,
        provider: "hotelbeds",
        provider_booking_id: b.reference,
        hotel_code,
        hotel_name,
        check_in,
        check_out,
        nights: b.hotel?.nights,
        rooms: b.rooms?.length || 1,
        total_amount: b.totalNet,
        currency: b.currency,
        cancellation_policy: b.hotel?.rooms?.[0]?.rates?.[0]?.cancellationPolicies,
        status: b.status === "CONFIRMED" ? "confirmed" : "pending",
        booked_at: new Date().toISOString(),
        metadata: { hotelbeds_booking: b }
      })
      await supabase.from("reservations").update({ status: "confirmed" }).eq("id", reservation_id)
    }

    await supabase.from("audit_log").insert({ user_id: user.id, action: "hotel_booked", entity_type: "hotel_booking", new_data: { booking_reference: b.reference, reservation_id } })

    return new Response(JSON.stringify({ booking: b, success: true }), { headers })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
