import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const DUFFEL_API = "https://api.duffel.com"

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
    const { offer_id, passengers, reservation_id, payment_amount, payment_currency = "USD" } = body

    // Get Duffel token
    const { data: [integration] } = await supabase.from("integrations").select("credentials,is_active").eq("provider", "duffel")
    if (!integration?.is_active || !integration?.credentials?.token) {
      return new Response(JSON.stringify({ error: "Duffel API no configurada", code: "NOT_CONFIGURED" }), { status: 422, headers })
    }
    const duffelToken = integration.credentials.token

    // Create Duffel order (books the flight)
    const orderRes = await fetch(`${DUFFEL_API}/air/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${duffelToken}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "instant",
          selected_offers: [offer_id],
          passengers,
          payments: [{
            type: "balance",
            amount: payment_amount,
            currency: payment_currency,
          }]
        }
      })
    })

    if (!orderRes.ok) {
      const err = await orderRes.json()
      return new Response(JSON.stringify({ error: err.errors?.[0]?.message || "Error al reservar", details: err }), { status: orderRes.status, headers })
    }

    const { data: order } = await orderRes.json()

    // Save booking to database
    if (reservation_id) {
      await supabase.from("flight_bookings").insert({
        reservation_id,
        provider: "duffel",
        provider_order_id: order.id,
        offer_id,
        airline_code: order.slices?.[0]?.segments?.[0]?.marketing_carrier?.iata_code,
        airline_name: order.slices?.[0]?.segments?.[0]?.marketing_carrier?.name,
        origin_iata: order.slices?.[0]?.origin?.iata_code,
        destination_iata: order.slices?.[0]?.destination?.iata_code,
        origin_city: order.slices?.[0]?.origin?.city_name,
        destination_city: order.slices?.[0]?.destination?.city_name,
        departure_at: order.slices?.[0]?.segments?.[0]?.departing_at,
        arrives_at: order.slices?.[0]?.segments?.[0]?.arriving_at,
        total_amount: order.total_amount,
        currency: order.total_currency,
        tickets: order.documents || [],
        segments: order.slices,
        passengers_data: order.passengers,
        status: "confirmed",
        booked_at: new Date().toISOString(),
        metadata: { duffel_order: order }
      })

      // Update reservation status
      await supabase.from("reservations").update({ status: "confirmed", gds_pnr: order.id }).eq("id", reservation_id)
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "flight_booked",
      entity_type: "flight_booking",
      new_data: { order_id: order.id, offer_id, reservation_id }
    })

    return new Response(JSON.stringify({ order, success: true }), { headers })

  } catch (err: any) {
    console.error("book-flight error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
