// Gemini AI service — equipment mapping + listing data extraction
import { EQUIPMENT_GROUPS } from '../data/equipment.js';

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function getApiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('VITE_GEMINI_API_KEY ni nastavljen v .env datoteki.');
  }
  return key;
}

async function callGemini(prompt, maxTokens = 1024) {
  const apiKey = getApiKey();
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API napaka (${res.status}): ${err}`);
  }
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function cleanJson(raw) {
  return raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
}

// ── Parse full listing from raw scraped text ───────────────────────────────────
export async function parseListingWithGemini(rawText, allowedBrands, allowedEquipmentSlugs) {
  const brandsHint = allowedBrands.slice(0, 120).join(', '); // cap to avoid token overrun
  const slugsHint  = allowedEquipmentSlugs.join(', ');

  const prompt = `Ti si asistent za ekstrakcijo avtomobilskih podatkov. Vrni SAMO veljavni JSON objekt, brez markdowna, brez razlag.

Surovi tekst oglasa:
"""
${rawText}
"""

Izlušči ta polja:
- brand (string): MORA biti IZKLJUČNO iz tega seznama: ${brandsHint}
- model (string): model vozila (brez marketinških oznak, npr. "Golf", "Serija 3", "A4")
- year (number|null): letnik izdelave
- price (number|null): cena v EUR (samo številka, brez valute)
- mileage (number|null): prevoženi kilometri (samo številka)
- fuel (string|null): ena od vrednosti: Bencin, Dizel, Elektrika, Hibrid, LPG, CNG, Vodik
- transmission (string|null): ena od vrednosti: Ročni, Avtomatski, Polavtomatski
- powerKw (number|null): moč v kilovatih
- equipment (array): IZKLJUČNO iz tega seznama slugov: ${slugsHint}

Pravila:
1. brand in model morata biti iz dovoljenih vrednosti ali null
2. equipment vsebuje samo slugs iz dovoljenega seznama — nobenih lastnih vrednosti
3. Če česa ne najdeš, vrni null za tisto polje (ne prazne nize)
4. Vrni SAMO JSON, nič drugega`;

  const raw = await callGemini(prompt, 1024);
  const parsed = JSON.parse(cleanJson(raw));

  // Sanitise: only keep valid equipment slugs
  if (Array.isArray(parsed.equipment)) {
    parsed.equipment = parsed.equipment.filter(s => allowedEquipmentSlugs.includes(s));
  } else {
    parsed.equipment = [];
  }

  return parsed;
}

// All valid equipment slugs — sent to AI as the allowed output set
const ALL_SLUGS = EQUIPMENT_GROUPS.flatMap(g => g.items.map(i => i.value));

export async function mapEquipmentWithGemini(rawGermanText) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini] VITE_GEMINI_API_KEY ni nastavljen.');
    return [];
  }
  if (!rawGermanText?.trim()) return [];

  const prompt = `You are a vehicle equipment mapper. Your task is to read German car equipment text and map it to the allowed slugs list below.

ALLOWED SLUGS (return ONLY values from this list):
${ALL_SLUGS.join(', ')}

GERMAN EQUIPMENT TEXT:
${rawGermanText}

Rules:
- Return ONLY a valid JSON array of matching slugs, e.g. ["LED","Navigation","HeatedSeats"]
- If nothing matches, return []
- No markdown, no explanation, no code fences — pure JSON array only`;

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API napaka (${res.status}): ${err}`);
  }

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    // Filter to only valid slugs to guard against hallucinations
    return parsed.filter(s => ALL_SLUGS.includes(s));
  } catch {
    console.error('[Gemini] Neveljaven odgovor:', raw);
    return [];
  }
}
