import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const META_API = "https://graph.facebook.com/v18.0"

Deno.serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers })

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  const url = new URL(req.url)

  // Webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")
    const { data: [integration] } = await supabase.from("integrations").select("config").eq("provider", "meta_business")
    if (mode === "subscribe" && token === integration?.config?.verify_token) {
      return new Response(challenge, { status: 200 })
    }
    return new Response("Forbidden", { status: 403 })
  }

  // Incoming webhook (POST from Meta)
  if (req.method === "POST" && !req.headers.get("Authorization")) {
    try {
      const body = await req.json()
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value
          if (change.field === "messages") {
            for (const msg of value.messages || []) {
              const contact = value.contacts?.[0]
              const phone = msg.from
              const channel = "whatsapp"

              // Find or create conversation
              let { data: conv } = await supabase.from("conversations")
                .select("id").eq("channel_id", phone).eq("channel", channel).maybeSingle()

              if (!conv) {
                const { data: newConv } = await supabase.from("conversations").insert({
                  channel, channel_id: phone, contact_name: contact?.profile?.name || phone,
                  contact_phone: phone, status: "open", last_message_at: new Date().toISOString(),
                }).select("id").single()
                conv = newConv
              }

              // Save message
              if (conv?.id) {
                await supabase.from("messages").insert({
                  conversation_id: conv.id, direction: "inbound",
                  sender_id: phone, sender_name: contact?.profile?.name,
                  content: msg.text?.body || msg.type,
                  message_type: msg.type, provider_message_id: msg.id, status: "delivered",
                  created_at: new Date(parseInt(msg.timestamp) * 1000).toISOString()
                })
                await supabase.from("conversations").update({ last_message_at: new Date().toISOString(), last_message_preview: msg.text?.body?.substring(0, 100), unread_count: supabase.rpc("increment", { x: 1 }) }).eq("id", conv.id)
              }
            }
          }
        }
      }
      return new Response(JSON.stringify({ success: true }), { headers })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
    }
  }

  // Authenticated API calls (send message, etc.)
  try {
    const authHeader = req.headers.get("Authorization")!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (!user) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers })

    const body = await req.json()
    const { action, conversation_id, message, channel, phone_number_id, recipient } = body

    const { data: [integration] } = await supabase.from("integrations").select("credentials,is_active,config").eq("provider", "meta_business")
    if (!integration?.is_active || !integration?.credentials?.access_token) {
      return new Response(JSON.stringify({ error: "Meta Business no configurado", code: "NOT_CONFIGURED" }), { status: 422, headers })
    }

    const token = integration.credentials.access_token

    if (action === "send_whatsapp") {
      const payload: any = {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message }
      }
      const res = await fetch(`${META_API}/${phone_number_id}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) return new Response(JSON.stringify({ error: "Error al enviar mensaje", details: data }), { status: res.status, headers })

      // Save outbound message
      if (conversation_id) {
        await supabase.from("messages").insert({
          conversation_id, direction: "outbound",
          sender_id: user.id, sender_name: "Agent",
          content: message, message_type: "text",
          provider_message_id: data.messages?.[0]?.id, status: "sent"
        })
        await supabase.from("conversations").update({ last_message_at: new Date().toISOString(), last_message_preview: message }).eq("id", conversation_id)
      }

      return new Response(JSON.stringify({ success: true, message_id: data.messages?.[0]?.id }), { headers })
    }

    return new Response(JSON.stringify({ error: "Acción no soportada" }), { status: 400, headers })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
