# ✈️ Skybridge Travel — Operations Platform

Plataforma interna de gestión para agencias de viajes. React + Vite + Supabase + Duffel + Hotelbeds + Meta Business.

---

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (ya están en .env)
# El proyecto ya está conectado a Supabase (cysneoxmhwkbkhqdulwm)

# 3. Iniciar en desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🔌 Configurar integraciones reales

Ve a **Configuración → Integraciones** dentro del sistema:

### ✈️ Vuelos reales (Duffel API)
1. Regístrate en https://app.duffel.com
2. Crea un Access Token en: Access tokens → Create token
3. En Skybridge: Configuración → Duffel → pega el token → Guardar
4. **Modo Sandbox** para pruebas, **Producción** para reservas reales

### 🏨 Hoteles reales (Hotelbeds)
1. Regístrate en https://developer.hotelbeds.com
2. Obtén tu API Key y Secret
3. En Skybridge: Configuración → Hotelbeds → API Key + Secret → Guardar
4. Cambia modo a **Producción** cuando estés listo

### 💬 WhatsApp / Instagram / Facebook (Meta Business)
1. Ve a https://developers.facebook.com → Create App
2. Agrega WhatsApp Business API
3. Obtén Access Token permanente + Phone Number ID
4. En Skybridge: Configuración → Meta Business → pega credenciales
5. URL del webhook: `https://cysneoxmhwkbkhqdulwm.supabase.co/functions/v1/meta-webhook`

### 📞 Twilio (Llamadas VoIP)
1. Regístrate en https://www.twilio.com
2. Obtén Account SID + Auth Token + número de teléfono
3. En Skybridge: Configuración → Twilio → pega credenciales

### 📅 Google Calendar
1. Ve a https://console.cloud.google.com
2. Crea proyecto → Habilita Calendar API
3. Crea credenciales OAuth 2.0
4. En Skybridge: Configuración → Google Workspace

### 💳 Pagos (Stripe / PayPal)
- Stripe: https://dashboard.stripe.com → Developers → API Keys
- PayPal: https://developer.paypal.com → My Apps → Create App

---

## 📦 Desplegar Edge Functions

```bash
# Login en Supabase CLI
npx supabase login

# Desplegar todas las funciones
bash DEPLOY_EDGE_FUNCTIONS.sh
```

O manualmente en https://supabase.com/dashboard/project/cysneoxmhwkbkhqdulwm/functions

---

## 🎯 Funcionalidades clave

| Módulo | Descripción |
|--------|-------------|
| Dashboard | KPIs en tiempo real desde Supabase |
| Vuelos | Búsqueda real via Duffel GDS — reserva directa |
| Hoteles | Búsqueda real via Hotelbeds — 180k+ hoteles |
| Clientes | CRM completo con perfil 360° |
| Reservas | Gestión completa con pagos y documentos |
| Conversaciones | WhatsApp + Instagram + Facebook unificado |
| Panel Meta | **Panel fijo derecho** — envía tarjetas de vuelo/hotel con tu precio |
| Llamadas | Softphone VoIP (Twilio) |
| Tareas | Kanban + lista con asignación a agentes |
| Reportes | Gráficos con Recharts desde datos reales |
| Configuración | Panel de integraciones API |

---

## 💰 Panel de markup (ganancia del agente)

Cuando buscas un vuelo u hotel y haces clic en **"📤 Enviar a cliente"**:
1. Se abre el panel Meta a la derecha
2. La tarjeta se auto-llena con los datos del vuelo/hotel
3. El precio base viene de la API (costo real)
4. **Puedes ajustar tu ganancia** — por defecto +$150 USD
5. El cliente SOLO ve el precio final (tu precio, no el costo)
6. Envías la tarjeta directamente por WhatsApp/Instagram/Facebook

---

## 🗄️ Base de datos (Supabase)

Proyecto: `cysneoxmhwkbkhqdulwm` | Región: US East 1

**17 tablas:** profiles, clients, client_documents, reservations, flight_bookings, hotel_bookings, payments, conversations, messages, calls, tasks, notes, internal_messages, notifications, email_templates, integrations, audit_log

---

## 📁 Estructura del proyecto

```
skybridge-travel/
├── src/
│   ├── pages/          # 13 módulos completos
│   ├── components/
│   │   ├── layout/     # Sidebar + Header + AppLayout + MetaSidePanel
│   │   └── ui/         # Button, Badge, Table, Modal, etc.
│   ├── context/        # AppContext (estado global + Meta panel)
│   ├── lib/            # Supabase client
│   └── data/           # 180+ aeropuertos IATA reales
├── supabase/
│   └── functions/      # 6 Edge Functions (Duffel, Hotelbeds, Meta, Calendar)
├── dist/               # Build de producción listo
└── DEPLOY_EDGE_FUNCTIONS.sh
```
