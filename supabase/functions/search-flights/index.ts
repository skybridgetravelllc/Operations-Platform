import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
    const body = await req.json()
    const { origin, destination, departure_date, return_date, adults = 1, children = 0, infants = 0, cabin_class = "economy" } = body

    // Get Duffel token from integrations table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    const integRes = await fetch(`${supabaseUrl}/rest/v1/integrations?provider=eq.duffel&select=credentials,is_active`, {
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey!}`, "Content-Type": "application/json" }
    })
    const [integration] = await integRes.json()

    if (!integration?.is_active || !integration?.credentials?.token) {
      return new Response(JSON.stringify({ error: "Duffel API no configurada. Configure el token en Configuración → Integraciones.", code: "NOT_CONFIGURED" }), { status: 422, headers })
    }

    const duffelToken = integration.credentials.token

    // Build slices
    const slices: any[] = [{ origin, destination, departure_date }]
    if (return_date) slices.push({ origin: destination, destination: origin, departure_date: return_date })

    // Create offer request with Duffel
    const offerReqRes = await fetch(`${DUFFEL_API}/air/offer_requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${duffelToken}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: [
            ...Array(adults).fill({ type: "adult" }),
            ...Array(children).fill({ type: "child" }),
            ...Array(infants).fill({ type: "infant_without_seat" }),
          ],
          cabin_class,
          return_offers: true,
        }
      })
    })

    if (!offerReqRes.ok) {
      const err = await offerReqRes.json()
      return new Response(JSON.stringify({ error: err.errors?.[0]?.message || "Error al buscar vuelos", details: err }), { status: offerReqRes.status, headers })
    }

    const { data: offerRequest } = await offerReqRes.json()

    // Fetch all offers
    const offersRes = await fetch(`${DUFFEL_API}/air/offers?offer_request_id=${offerRequest.id}&sort=total_amount&limit=50`, {
      headers: {
        "Authorization": `Bearer ${duffelToken}`,
        "Duffel-Version": "v2",
        "Accept": "application/json",
      }
    })

    if (!offersRes.ok) {
      const err = await offersRes.json()
      return new Response(JSON.stringify({ error: "Error al obtener ofertas", details: err }), { status: offersRes.status, headers })
    }

    const { data: offers, meta } = await offersRes.json()

    return new Response(JSON.stringify({ offers, offer_request_id: offerRequest.id, meta }), { headers })

  } catch (err: any) {
    console.error("search-flights error:", err)
    return new Response(JSON.stringify({ error: err.message || "Error interno del servidor" }), { status: 500, headers })
  }
})
