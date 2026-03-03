export const AMADEUS_BASE =
  process.env.AMADEUS_API_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let cachedToken: { value: string; expiresAt: number } | null = null;
const iataCache = new Map<string, string>();

export const IATA_FALLBACK: Record<string, string> = {
  tokyo: "TYO", narita: "NRT", haneda: "HND",
  osaka: "KIX", kyoto: "KIX", fukuoka: "FUK", sapporo: "CTS",
  seoul: "ICN", busan: "PUS",
  beijing: "PEK", shanghai: "PVG", "hong kong": "HKG", taipei: "TPE",
  bangkok: "BKK", "chiang mai": "CNX", phuket: "HKT",
  hanoi: "HAN", "ho chi minh city": "SGN", "ho chi minh": "SGN",
  saigon: "SGN", "da nang": "DAD",
  singapore: "SIN", "kuala lumpur": "KUL",
  jakarta: "CGK", bali: "DPS", denpasar: "DPS",
  manila: "MNL", cebu: "CEB",
  "new york": "JFK", "los angeles": "LAX", "san francisco": "SFO",
  chicago: "ORD", miami: "MIA", boston: "BOS", seattle: "SEA",
  denver: "DEN", atlanta: "ATL", dallas: "DFW", houston: "IAH",
  washington: "IAD", toronto: "YYZ", vancouver: "YVR",
  montreal: "YUL", calgary: "YYC", ottawa: "YOW",
  london: "LHR", paris: "CDG", rome: "FCO", milan: "MXP",
  madrid: "MAD", barcelona: "BCN", berlin: "BER", munich: "MUC",
  amsterdam: "AMS", brussels: "BRU", vienna: "VIE", zurich: "ZRH",
  geneva: "GVA", lisbon: "LIS", dublin: "DUB", prague: "PRG",
  budapest: "BUD", warsaw: "WAW", copenhagen: "CPH",
  stockholm: "ARN", oslo: "OSL", helsinki: "HEL",
  istanbul: "IST", athens: "ATH",
  dubai: "DXB", "abu dhabi": "AUH", doha: "DOH",
  sydney: "SYD", melbourne: "MEL", auckland: "AKL",
  "mexico city": "MEX", "sao paulo": "GRU",
  "buenos aires": "EZE", lima: "LIM", bogota: "BOG",
  cairo: "CAI", johannesburg: "JNB", nairobi: "NBO",
  mumbai: "BOM", delhi: "DEL", "new delhi": "DEL", bangalore: "BLR",
  colombo: "CMB", kathmandu: "KTM", "phnom penh": "PNH",
  "siem reap": "REP", vientiane: "VTE", yangon: "RGN",
};

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID ?? "",
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? "",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Amadeus] Auth failed:", res.status, errText);
    throw new Error(`Amadeus auth failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  console.log("[Amadeus] Auth success, token expires in", data.expires_in, "seconds");
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export async function resolveIata(
  city: string,
  token: string
): Promise<string | null> {
  const key = city.toLowerCase().trim();
  if (iataCache.has(key)) return iataCache.get(key)!;

  if (IATA_FALLBACK[key]) {
    const code = IATA_FALLBACK[key];
    iataCache.set(key, code);
    console.log("[Amadeus] IATA from fallback map:", city, "->", code);
    return code;
  }

  if (/^[A-Z]{3}$/i.test(city.trim())) {
    const code = city.trim().toUpperCase();
    iataCache.set(key, code);
    return code;
  }

  const url = `${AMADEUS_BASE}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(city)}&view=LIGHT`;
  console.log("[Amadeus] Resolving IATA via API for:", city);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("[Amadeus] Location lookup failed:", res.status);
      return null;
    }

    const data = await res.json();
    const loc =
      data.data?.find((d: Record<string, string>) => d.subType === "CITY") ??
      data.data?.[0];

    if (loc) {
      const iata = loc.iataCode as string;
      iataCache.set(key, iata);
      console.log("[Amadeus] IATA from API:", city, "->", iata);
      return iata;
    }
  } catch (err) {
    console.error("[Amadeus] Location lookup error:", err);
  }

  return null;
}
