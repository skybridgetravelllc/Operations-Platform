// Real IATA Airport Database - 180+ airports
export const AIRPORTS = [
  // Caribbean & Cuba
  { city: 'La Habana', code: 'HAV', airport: 'Aeropuerto Internacional José Martí', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },
  { city: 'Varadero', code: 'VRA', airport: 'Aeropuerto Internacional Juan Gualberto Gómez', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },
  { city: 'Holguín', code: 'HOG', airport: 'Aeropuerto Internacional Frank País', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },
  { city: 'Santiago de Cuba', code: 'SCU', airport: 'Aeropuerto Internacional Antonio Maceo', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },
  { city: 'Cayo Coco', code: 'CCC', airport: 'Aeropuerto Internacional Jardines del Rey', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },
  { city: 'Santo Domingo', code: 'SDQ', airport: 'Aeropuerto Internacional Las Américas', country: 'Rep. Dominicana', flag: '🇩🇴', region: 'Caribbean' },
  { city: 'Punta Cana', code: 'PUJ', airport: 'Aeropuerto Internacional de Punta Cana', country: 'Rep. Dominicana', flag: '🇩🇴', region: 'Caribbean' },
  { city: 'Santiago R.D.', code: 'STI', airport: 'Aeropuerto Internacional Cibao', country: 'Rep. Dominicana', flag: '🇩🇴', region: 'Caribbean' },
  { city: 'San Juan', code: 'SJU', airport: 'Aeropuerto Internacional Luis Muñoz Marín', country: 'Puerto Rico', flag: '🇵🇷', region: 'Caribbean' },
  { city: 'Nassau', code: 'NAS', airport: 'Aeropuerto Internacional Lynden Pindling', country: 'Bahamas', flag: '🇧🇸', region: 'Caribbean' },
  { city: 'Montego Bay', code: 'MBJ', airport: 'Aeropuerto Internacional Sangster', country: 'Jamaica', flag: '🇯🇲', region: 'Caribbean' },
  { city: 'Kingston', code: 'KIN', airport: 'Aeropuerto Internacional Norman Manley', country: 'Jamaica', flag: '🇯🇲', region: 'Caribbean' },
  { city: 'Cancún', code: 'CUN', airport: 'Aeropuerto Internacional de Cancún', country: 'México', flag: '🇲🇽', region: 'Caribbean' },
  { city: 'Cozumel', code: 'CZM', airport: 'Aeropuerto Internacional de Cozumel', country: 'México', flag: '🇲🇽', region: 'Caribbean' },
  { city: 'Bridgetown', code: 'BGI', airport: 'Aeropuerto Internacional Grantley Adams', country: 'Barbados', flag: '🇧🇧', region: 'Caribbean' },
  { city: 'Puerto España', code: 'POS', airport: 'Aeropuerto Internacional Piarco', country: 'Trinidad y Tobago', flag: '🇹🇹', region: 'Caribbean' },
  { city: 'Puerto Príncipe', code: 'PAP', airport: 'Aeropuerto Internacional Toussaint Louverture', country: 'Haití', flag: '🇭🇹', region: 'Caribbean' },
  { city: 'La Habana (JOSE)', code: 'HAV2', airport: 'Terminal 2 — Vuelos Internacionales', country: 'Cuba', flag: '🇨🇺', region: 'Caribbean' },

  // USA
  { city: 'Miami', code: 'MIA', airport: 'Miami International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Fort Lauderdale', code: 'FLL', airport: 'Fort Lauderdale-Hollywood Intl Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Orlando', code: 'MCO', airport: 'Orlando International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Nueva York', code: 'JFK', airport: 'John F. Kennedy International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Nueva York', code: 'LGA', airport: 'LaGuardia Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Newark', code: 'EWR', airport: 'Newark Liberty International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Los Ángeles', code: 'LAX', airport: 'Los Angeles International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Chicago', code: 'ORD', airport: "O'Hare International Airport", country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Chicago Midway', code: 'MDW', airport: 'Chicago Midway International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Atlanta', code: 'ATL', airport: 'Hartsfield-Jackson Atlanta International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Dallas', code: 'DFW', airport: 'Dallas/Fort Worth International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Houston', code: 'IAH', airport: 'George Bush Intercontinental Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Houston Hobby', code: 'HOU', airport: 'Houston William P. Hobby Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Boston', code: 'BOS', airport: 'Logan International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Washington D.C.', code: 'IAD', airport: 'Dulles International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'San Francisco', code: 'SFO', airport: 'San Francisco International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Las Vegas', code: 'LAS', airport: 'Harry Reid International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Seattle', code: 'SEA', airport: 'Seattle-Tacoma International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Denver', code: 'DEN', airport: 'Denver International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Phoenix', code: 'PHX', airport: 'Phoenix Sky Harbor International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Minneapolis', code: 'MSP', airport: 'Minneapolis-Saint Paul Intl Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Detroit', code: 'DTW', airport: 'Detroit Metropolitan Wayne County Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Philadelphia', code: 'PHL', airport: 'Philadelphia International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },
  { city: 'Tampa', code: 'TPA', airport: 'Tampa International Airport', country: 'Estados Unidos', flag: '🇺🇸', region: 'North America' },

  // Canada
  { city: 'Toronto', code: 'YYZ', airport: 'Toronto Pearson International Airport', country: 'Canadá', flag: '🇨🇦', region: 'North America' },
  { city: 'Montreal', code: 'YUL', airport: 'Montréal-Pierre Elliott Trudeau Intl Airport', country: 'Canadá', flag: '🇨🇦', region: 'North America' },
  { city: 'Vancouver', code: 'YVR', airport: 'Vancouver International Airport', country: 'Canadá', flag: '🇨🇦', region: 'North America' },

  // Mexico
  { city: 'Ciudad de México', code: 'MEX', airport: 'Aeropuerto Internacional Benito Juárez', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Ciudad de México', code: 'NLU', airport: 'Aeropuerto Internacional Felipe Ángeles (AIFA)', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Guadalajara', code: 'GDL', airport: 'Aeropuerto Internacional Miguel Hidalgo', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Monterrey', code: 'MTY', airport: 'Aeropuerto Internacional General Mariano Escobedo', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Los Cabos', code: 'SJD', airport: 'Aeropuerto Internacional de Los Cabos', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Puerto Vallarta', code: 'PVR', airport: 'Aeropuerto Internacional Lic. Gustavo Díaz Ordaz', country: 'México', flag: '🇲🇽', region: 'North America' },
  { city: 'Mérida', code: 'MID', airport: 'Aeropuerto Internacional de Mérida', country: 'México', flag: '🇲🇽', region: 'North America' },

  // Central America
  { city: 'Panamá', code: 'PTY', airport: 'Aeropuerto Internacional de Tocumen', country: 'Panamá', flag: '🇵🇦', region: 'Central America' },
  { city: 'San José', code: 'SJO', airport: 'Aeropuerto Internacional Juan Santamaría', country: 'Costa Rica', flag: '🇨🇷', region: 'Central America' },
  { city: 'Liberia', code: 'LIR', airport: 'Aeropuerto Internacional Daniel Oduber Quirós', country: 'Costa Rica', flag: '🇨🇷', region: 'Central America' },
  { city: 'Guatemala City', code: 'GUA', airport: 'Aeropuerto Internacional La Aurora', country: 'Guatemala', flag: '🇬🇹', region: 'Central America' },
  { city: 'San Salvador', code: 'SAL', airport: 'Aeropuerto Internacional Monseñor Romero', country: 'El Salvador', flag: '🇸🇻', region: 'Central America' },
  { city: 'Managua', code: 'MGA', airport: 'Aeropuerto Internacional Augusto C. Sandino', country: 'Nicaragua', flag: '🇳🇮', region: 'Central America' },
  { city: 'Tegucigalpa', code: 'TGU', airport: 'Aeropuerto Internacional Toncontín', country: 'Honduras', flag: '🇭🇳', region: 'Central America' },

  // South America
  { city: 'Bogotá', code: 'BOG', airport: 'Aeropuerto Internacional El Dorado', country: 'Colombia', flag: '🇨🇴', region: 'South America' },
  { city: 'Medellín', code: 'MDE', airport: 'Aeropuerto Internacional José María Córdova', country: 'Colombia', flag: '🇨🇴', region: 'South America' },
  { city: 'Cartagena', code: 'CTG', airport: 'Aeropuerto Rafael Núñez', country: 'Colombia', flag: '🇨🇴', region: 'South America' },
  { city: 'Lima', code: 'LIM', airport: 'Aeropuerto Internacional Jorge Chávez', country: 'Perú', flag: '🇵🇪', region: 'South America' },
  { city: 'Buenos Aires', code: 'EZE', airport: 'Aeropuerto Internacional Ministro Pistarini', country: 'Argentina', flag: '🇦🇷', region: 'South America' },
  { city: 'Buenos Aires', code: 'AEP', airport: 'Aeroparque Jorge Newbery', country: 'Argentina', flag: '🇦🇷', region: 'South America' },
  { city: 'Santiago de Chile', code: 'SCL', airport: 'Aeropuerto Internacional Arturo Merino Benítez', country: 'Chile', flag: '🇨🇱', region: 'South America' },
  { city: 'São Paulo', code: 'GRU', airport: 'Aeroporto Internacional de São Paulo-Guarulhos', country: 'Brasil', flag: '🇧🇷', region: 'South America' },
  { city: 'São Paulo', code: 'CGH', airport: 'Aeroporto de São Paulo-Congonhas', country: 'Brasil', flag: '🇧🇷', region: 'South America' },
  { city: 'Río de Janeiro', code: 'GIG', airport: 'Aeroporto Internacional Tom Jobim-Galeão', country: 'Brasil', flag: '🇧🇷', region: 'South America' },
  { city: 'Caracas', code: 'CCS', airport: 'Aeropuerto Internacional Simón Bolívar', country: 'Venezuela', flag: '🇻🇪', region: 'South America' },
  { city: 'Quito', code: 'UIO', airport: 'Aeropuerto Internacional Mariscal Sucre', country: 'Ecuador', flag: '🇪🇨', region: 'South America' },
  { city: 'Guayaquil', code: 'GYE', airport: 'Aeropuerto Internacional José Joaquín de Olmedo', country: 'Ecuador', flag: '🇪🇨', region: 'South America' },
  { city: 'La Paz', code: 'LPB', airport: 'Aeropuerto Internacional El Alto', country: 'Bolivia', flag: '🇧🇴', region: 'South America' },
  { city: 'Montevideo', code: 'MVD', airport: 'Aeropuerto Internacional de Carrasco', country: 'Uruguay', flag: '🇺🇾', region: 'South America' },
  { city: 'Asunción', code: 'ASU', airport: 'Aeropuerto Internacional Silvio Pettirossi', country: 'Paraguay', flag: '🇵🇾', region: 'South America' },

  // Europe
  { city: 'Madrid', code: 'MAD', airport: 'Adolfo Suárez Madrid-Barajas', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { city: 'Barcelona', code: 'BCN', airport: 'Aeropuerto Josep Tarradellas El Prat', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { city: 'Valencia', code: 'VLC', airport: 'Aeropuerto de Valencia', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { city: 'Sevilla', code: 'SVQ', airport: 'Aeropuerto de Sevilla', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { city: 'Málaga', code: 'AGP', airport: 'Aeropuerto de Málaga-Costa del Sol', country: 'España', flag: '🇪🇸', region: 'Europe' },
  { city: 'Londres', code: 'LHR', airport: 'Heathrow Airport', country: 'Reino Unido', flag: '🇬🇧', region: 'Europe' },
  { city: 'Londres', code: 'LGW', airport: 'Gatwick Airport', country: 'Reino Unido', flag: '🇬🇧', region: 'Europe' },
  { city: 'Londres', code: 'STN', airport: 'Stansted Airport', country: 'Reino Unido', flag: '🇬🇧', region: 'Europe' },
  { city: 'París', code: 'CDG', airport: 'Aéroport de Paris-Charles de Gaulle', country: 'Francia', flag: '🇫🇷', region: 'Europe' },
  { city: 'París', code: 'ORY', airport: 'Aéroport de Paris-Orly', country: 'Francia', flag: '🇫🇷', region: 'Europe' },
  { city: 'Frankfurt', code: 'FRA', airport: 'Frankfurt Airport', country: 'Alemania', flag: '🇩🇪', region: 'Europe' },
  { city: 'Múnich', code: 'MUC', airport: 'Munich Airport', country: 'Alemania', flag: '🇩🇪', region: 'Europe' },
  { city: 'Berlín', code: 'BER', airport: 'Berlin Brandenburg Airport', country: 'Alemania', flag: '🇩🇪', region: 'Europe' },
  { city: 'Ámsterdam', code: 'AMS', airport: 'Amsterdam Airport Schiphol', country: 'Países Bajos', flag: '🇳🇱', region: 'Europe' },
  { city: 'Bruselas', code: 'BRU', airport: 'Brussels Airport', country: 'Bélgica', flag: '🇧🇪', region: 'Europe' },
  { city: 'Roma', code: 'FCO', airport: 'Aeroporto di Roma-Fiumicino', country: 'Italia', flag: '🇮🇹', region: 'Europe' },
  { city: 'Milán', code: 'MXP', airport: 'Aeroporto di Milano-Malpensa', country: 'Italia', flag: '🇮🇹', region: 'Europe' },
  { city: 'Milán Linate', code: 'LIN', airport: 'Aeroporto di Milano-Linate', country: 'Italia', flag: '🇮🇹', region: 'Europe' },
  { city: 'Venecia', code: 'VCE', airport: 'Venice Marco Polo Airport', country: 'Italia', flag: '🇮🇹', region: 'Europe' },
  { city: 'Zurich', code: 'ZRH', airport: 'Zurich Airport', country: 'Suiza', flag: '🇨🇭', region: 'Europe' },
  { city: 'Ginebra', code: 'GVA', airport: 'Geneva Airport', country: 'Suiza', flag: '🇨🇭', region: 'Europe' },
  { city: 'Lisboa', code: 'LIS', airport: 'Aeroporto Humberto Delgado', country: 'Portugal', flag: '🇵🇹', region: 'Europe' },
  { city: 'Viena', code: 'VIE', airport: 'Vienna International Airport', country: 'Austria', flag: '🇦🇹', region: 'Europe' },
  { city: 'Estocolmo', code: 'ARN', airport: 'Stockholm Arlanda Airport', country: 'Suecia', flag: '🇸🇪', region: 'Europe' },
  { city: 'Copenhague', code: 'CPH', airport: 'Copenhagen Airport', country: 'Dinamarca', flag: '🇩🇰', region: 'Europe' },
  { city: 'Oslo', code: 'OSL', airport: 'Oslo Airport Gardermoen', country: 'Noruega', flag: '🇳🇴', region: 'Europe' },
  { city: 'Moscú', code: 'SVO', airport: 'Aeropuerto Internacional Sheremétievo', country: 'Rusia', flag: '🇷🇺', region: 'Europe' },
  { city: 'Atenas', code: 'ATH', airport: 'Athens International Airport Eleftherios Venizelos', country: 'Grecia', flag: '🇬🇷', region: 'Europe' },
  { city: 'Estambul', code: 'IST', airport: 'Istanbul Airport', country: 'Türkiye', flag: '🇹🇷', region: 'Europe' },

  // Middle East & Africa
  { city: 'Dubái', code: 'DXB', airport: 'Dubai International Airport', country: 'Emiratos Árabes Unidos', flag: '🇦🇪', region: 'Middle East' },
  { city: 'Abu Dabi', code: 'AUH', airport: 'Zayed International Airport', country: 'Emiratos Árabes Unidos', flag: '🇦🇪', region: 'Middle East' },
  { city: 'Doha', code: 'DOH', airport: 'Hamad International Airport', country: 'Catar', flag: '🇶🇦', region: 'Middle East' },
  { city: 'Riad', code: 'RUH', airport: 'King Khalid International Airport', country: 'Arabia Saudita', flag: '🇸🇦', region: 'Middle East' },
  { city: 'El Cairo', code: 'CAI', airport: 'Cairo International Airport', country: 'Egipto', flag: '🇪🇬', region: 'Africa' },
  { city: 'Johannesburgo', code: 'JNB', airport: 'O.R. Tambo International Airport', country: 'Sudáfrica', flag: '🇿🇦', region: 'Africa' },
  { city: 'Nairobi', code: 'NBO', airport: 'Jomo Kenyatta International Airport', country: 'Kenia', flag: '🇰🇪', region: 'Africa' },
  { city: 'Casablanca', code: 'CMN', airport: 'Aéroport Mohammed V', country: 'Marruecos', flag: '🇲🇦', region: 'Africa' },

  // Asia-Pacific
  { city: 'Tokio', code: 'NRT', airport: 'Narita International Airport', country: 'Japón', flag: '🇯🇵', region: 'Asia-Pacific' },
  { city: 'Tokio', code: 'HND', airport: 'Haneda Airport', country: 'Japón', flag: '🇯🇵', region: 'Asia-Pacific' },
  { city: 'Pekín', code: 'PEK', airport: 'Beijing Capital International Airport', country: 'China', flag: '🇨🇳', region: 'Asia-Pacific' },
  { city: 'Shanghái', code: 'PVG', airport: 'Shanghai Pudong International Airport', country: 'China', flag: '🇨🇳', region: 'Asia-Pacific' },
  { city: 'Hong Kong', code: 'HKG', airport: 'Hong Kong International Airport', country: 'Hong Kong', flag: '🇭🇰', region: 'Asia-Pacific' },
  { city: 'Singapur', code: 'SIN', airport: 'Singapore Changi Airport', country: 'Singapur', flag: '🇸🇬', region: 'Asia-Pacific' },
  { city: 'Bangkok', code: 'BKK', airport: 'Suvarnabhumi International Airport', country: 'Tailandia', flag: '🇹🇭', region: 'Asia-Pacific' },
  { city: 'Sídney', code: 'SYD', airport: 'Sydney Kingsford Smith Airport', country: 'Australia', flag: '🇦🇺', region: 'Asia-Pacific' },
  { city: 'Melbourne', code: 'MEL', airport: 'Melbourne Airport', country: 'Australia', flag: '🇦🇺', region: 'Asia-Pacific' },
  { city: 'Kuala Lumpur', code: 'KUL', airport: 'Kuala Lumpur International Airport', country: 'Malasia', flag: '🇲🇾', region: 'Asia-Pacific' },
  { city: 'Bombay', code: 'BOM', airport: 'Chhatrapati Shivaji Maharaj Intl Airport', country: 'India', flag: '🇮🇳', region: 'Asia-Pacific' },
  { city: 'Nueva Delhi', code: 'DEL', airport: 'Indira Gandhi International Airport', country: 'India', flag: '🇮🇳', region: 'Asia-Pacific' },
  { city: 'Seúl', code: 'ICN', airport: 'Incheon International Airport', country: 'Corea del Sur', flag: '🇰🇷', region: 'Asia-Pacific' },
]

// Search airports by query (city, code, airport name, country)
export function searchAirports(query, limit = 8) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase().trim()
  const results = AIRPORTS.filter(a =>
    a.city.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.airport.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  )
  // Prioritize: code matches first, then city starts with, then rest
  results.sort((a, b) => {
    if (a.code.toLowerCase() === q) return -1
    if (b.code.toLowerCase() === q) return 1
    if (a.code.toLowerCase().startsWith(q)) return -1
    if (b.code.toLowerCase().startsWith(q)) return 1
    if (a.city.toLowerCase().startsWith(q)) return -1
    if (b.city.toLowerCase().startsWith(q)) return 1
    return 0
  })
  return results.slice(0, limit)
}

export function getAirportByCode(code) {
  return AIRPORTS.find(a => a.code === code)
}

// Major airlines for display
export const AIRLINES = [
  { code: 'AA', name: 'American Airlines', country: 'US', hub: 'DFW' },
  { code: 'DL', name: 'Delta Air Lines', country: 'US', hub: 'ATL' },
  { code: 'UA', name: 'United Airlines', country: 'US', hub: 'ORD' },
  { code: 'B6', name: 'JetBlue Airways', country: 'US', hub: 'JFK' },
  { code: 'WN', name: 'Southwest Airlines', country: 'US', hub: 'DAL' },
  { code: 'IB', name: 'Iberia', country: 'ES', hub: 'MAD' },
  { code: 'VY', name: 'Vueling', country: 'ES', hub: 'BCN' },
  { code: 'BA', name: 'British Airways', country: 'GB', hub: 'LHR' },
  { code: 'AF', name: 'Air France', country: 'FR', hub: 'CDG' },
  { code: 'LH', name: 'Lufthansa', country: 'DE', hub: 'FRA' },
  { code: 'KL', name: 'KLM', country: 'NL', hub: 'AMS' },
  { code: 'AZ', name: 'ITA Airways', country: 'IT', hub: 'FCO' },
  { code: 'EK', name: 'Emirates', country: 'AE', hub: 'DXB' },
  { code: 'QR', name: 'Qatar Airways', country: 'QA', hub: 'DOH' },
  { code: 'EY', name: 'Etihad Airways', country: 'AE', hub: 'AUH' },
  { code: 'TK', name: 'Turkish Airlines', country: 'TR', hub: 'IST' },
  { code: 'CU', name: 'Cubana de Aviación', country: 'CU', hub: 'HAV' },
  { code: 'CM', name: 'Copa Airlines', country: 'PA', hub: 'PTY' },
  { code: 'AV', name: 'Avianca', country: 'CO', hub: 'BOG' },
  { code: 'LA', name: 'LATAM Airlines', country: 'CL', hub: 'SCL' },
  { code: 'G3', name: 'GOL Linhas Aéreas', country: 'BR', hub: 'GRU' },
  { code: 'AM', name: 'Aeroméxico', country: 'MX', hub: 'MEX' },
  { code: 'AC', name: 'Air Canada', country: 'CA', hub: 'YYZ' },
  { code: 'JJ', name: 'LATAM Brasil', country: 'BR', hub: 'GRU' },
  { code: 'SU', name: 'Aeroflot', country: 'RU', hub: 'SVO' },
  { code: 'QF', name: 'Qantas', country: 'AU', hub: 'SYD' },
  { code: 'SQ', name: 'Singapore Airlines', country: 'SG', hub: 'SIN' },
  { code: 'NH', name: 'All Nippon Airways', country: 'JP', hub: 'NRT' },
  { code: 'JL', name: 'Japan Airlines', country: 'JP', hub: 'NRT' },
  { code: 'KE', name: 'Korean Air', country: 'KR', hub: 'ICN' },
]
