import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { crypto } from "jsr:@std/crypto"

const HOTELBEDS_API = "https://api.test.hotelbeds.com" // Change to production: https://api.hotelbeds.com

function generateSignature(apiKey: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const raw = apiKey + secret + timestamp
  // SHA256 hex of raw string
  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers })

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const body = await req.json()
    const { destination_code, check_in, check_out, adults = 2, children = 0, rooms = 1, language = "ENG" } = body

    // Get Hotelbeds credentials
    const { data: [integration] } = await supabase.from("integrations").select("credentials,is_active,config").eq("provider", "hotelbeds")
    if (!integration?.is_active) {
      return new Response(JSON.stringify({ error: "Hotelbeds API no configurada. Configure las credenciales en Configuración → Integraciones.", code: "NOT_CONFIGURED" }), { status: 422, headers })
    }

    const { api_key, secret } = integration.credentials || {}
    if (!api_key || !secret) {
      return new Response(JSON.stringify({ error: "API Key y Secret de Hotelbeds requeridos", code: "MISSING_CREDENTIALS" }), { status: 422, headers })
    }

    const baseUrl = integration.config?.mode === "production" ? "https://api.hotelbeds.com" : HOTELBEDS_API
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // SHA256 signature: sha256(apikey + secret + timestamp)
    const hashInput = api_key + secret + timestamp
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput))
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const searchBody = {
      stay: { checkIn: check_in, checkOut: check_out },
      occupancies: [{ rooms, adults, children: children > 0 ? children : undefined }],
      destination: { code: destination_code },
      filter: { maxHotels: 50 },
      language,
    }

    const res = await fetch(`${baseUrl}/hotel-api/v1/hotels`, {
      method: "POST",
      headers: {
        "Api-key": api_key,
        "X-Signature": signature,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody)
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: "Error al buscar hoteles", details: err }), { status: res.status, headers })
    }

    const data = await res.json()
    return new Response(JSON.stringify({ hotels: data.hotels?.hotels || [], total: data.hotels?.total || 0 }), { headers })

  } catch (err: any) {
    console.error("search-hotels error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
