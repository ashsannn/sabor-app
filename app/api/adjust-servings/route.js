// app/api/adjust-servings/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 20;

/* --------------------------- ENV / KEY ROTATION --------------------------- */
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODELS = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];

/* -------------------------- LIGHT SAFETY SCAN ----------------------------- */
// We’re not taking a free-text prompt here, but we can still sanity-check ingredients.
const HAZMAT = ["rat poison","poison","bleach","lye","detergent","ammonia","antifreeze","cyanide","arsenic","mercury","lead","paint thinner","gasoline","fertilizer"];
const BIO = ["poop","feces","faeces","urine","pee","vomit","vomitus","blood","semen"];
const RAW_UNSAFE = ["raw chicken","raw pork","raw ground","pink chicken","raw kidney beans","bitter almonds","raw elderberries","improper cassava"];

function containsAny(s, list) {
  const hay = ` ${String(s || "").toLowerCase()} `;
  return list.some(t => hay.includes(` ${t.toLowerCase()} `));
}

function basicRecipeSafety(recipe) {
  const text = (Array.isArray(recipe?.ingredients) ? recipe.ingredients.join(" \n ") : "") + " " + (recipe?.title || "");
  if (containsAny(text, HAZMAT)) return { invalid: true, reason: "hazmat" };
  if (containsAny(text, BIO)) return { invalid: true, reason: "bio" };
  if (containsAny(text, RAW_UNSAFE)) return { invalid: true, reason: "unsafe_raw" };
  return { invalid: false };
}

/* ------------------------- INGREDIENT SCALING ----------------------------- */
// Fractions support (unicode)
const FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅐": 1/7, "⅑": 1/9, "⅒": 0.1, "⅓": 1/3, "⅔": 2/3,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1/6, "⅚": 5/6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875
};
function unicodeToDecimal(s) {
  return String(s).replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (m) => String(FRACTIONS[m] ?? m));
}

// Extract a leading quantity from an ingredient line.
// Returns { qty: number|null, rest: string }
function extractLeadingQuantity(line) {
  const original = String(line).trim();

  // leave section headers like **For the Sauce:** untouched
  if (/^\s*\*\*.*\*\*\s*$/.test(original)) return { qty: null, rest: original };

  const s = unicodeToDecimal(original.toLowerCase())
    .replace(/^~|\babout\b|\bapprox(?:\.|imately)?\b/g, "")
    .trim();

  // range: 2–3 / 2-3 / 2 to 3
  const range = s.match(/^(\d+(?:\.\d+)?)\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const avg = (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    const rest = original.slice(original.toLowerCase().indexOf(range[0]) + range[0].length).trim();
    return { qty: avg, rest };
  }

  // mixed number "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const num = parseInt(mixed[2], 10);
    const den = parseInt(mixed[3], 10) || 1;
    const qty = whole + num / den;
    const rest = original.slice(original.toLowerCase().indexOf(mixed[0]) + mixed[0].length).trim();
    return { qty, rest };
  }

  // fraction "1/2"
  const frac = s.match(/^(\d+)\/(\d+)/);
  if (frac) {
    const qty = parseInt(frac[1], 10) / (parseInt(frac[2], 10) || 1);
    const rest = original.slice(original.toLowerCase().indexOf(frac[0]) + frac[0].length).trim();
    return { qty, rest };
  }

  // simple number "1" or "1.5"
  const simple = s.match(/^(\d+(?:\.\d+)?)/);
  if (simple) {
    const qty = parseFloat(simple[1]);
    const rest = original.slice(original.toLowerCase().indexOf(simple[0]) + simple[0].length).trim();
    return { qty, rest };
  }

  return { qty: null, rest: original };
}

// Render quantity as nice fractions in 1/8 steps
function formatQty(n) {
  if (!isFinite(n) || n <= 0) return null;
  const whole = Math.floor(n);
  const frac = n - whole;
  const eighths = Math.round(frac * 8);
  const MAP = { 1: "⅛", 2: "¼", 3: "⅜", 4: "½", 5: "⅝", 6: "¾", 7: "⅞" };
  if (eighths === 0) return String(whole);
  if (eighths === 8) return String(whole + 1);
  const piece = MAP[eighths] || (eighths + "/8");
  return whole > 0 ? `${whole} ${piece}` : piece;
}

function scaleIngredientLine(line, factor) {
  const { qty, rest } = extractLeadingQuantity(line);
  if (qty == null) return String(line); // leave text/headers untouched
  const scaled = qty * factor;
  const pretty = formatQty(scaled) ?? scaled.toFixed(2).replace(/\.00$/, "");
  return `${pretty} ${rest}`.replace(/\s{2,}/g, " ").trim();
}

/* ------------------------------ NORMALIZE -------------------------------- */
const REQUIRED_FIELDS = [
  "title","servings","calories","prep","cook","totalTime","servingSize","ingredients","instructions","sources"
];

const toInt = (v) => (Number.isFinite(v) ? v : parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0);
const arr = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
const str = (v, f) => (typeof v === "string" && v.trim() ? v.trim() : f);

function fmtTime(mins) {
  if (!Number.isFinite(mins)) mins = 0;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} min${rem !== 1 ? "s" : ""}` : `${hrs} hr${hrs > 1 ? "s" : ""}`;
  }
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

function normalizeRecipeShape(data) {
  const out = { ...data };
  out.title = str(out.title, "Untitled Recipe");
  out.servings = toInt(out.servings || 1);
  out.calories = toInt(out.calories || out?.nutrition?.caloriesPerServing || 0);
  out.prep = toInt(out.prep || 0);
  out.cook = toInt(out.cook || 0);
  out.totalTime = Math.max(toInt(out.totalTime || 0), out.prep + out.cook);
  out.servingSize = str(out.servingSize, "1 serving");
  out.ingredients = arr(out.ingredients);
  out.instructions = arr(out.instructions);
  out.toolsNeeded = arr(out.toolsNeeded);
  out.sources = arr(out.sources);
  while (out.sources.length < 3) out.sources.push("Source — https://example.com");

  out.prepTimeDisplay = fmtTime(out.prep);
  out.cookTimeDisplay = fmtTime(out.cook);
  out.totalTimeDisplay = fmtTime(out.totalTime);

  for (const k of REQUIRED_FIELDS) {
    if (!(k in out)) {
      if (["ingredients","instructions","sources"].includes(k)) out[k] = [];
      else if (["servings","calories","prep","cook","totalTime"].includes(k)) out[k] = 0;
      else out[k] = "";
    }
  }
  return out;
}

/* ----------------------------- GEMINI HELPER ------------------------------ */
async function callGeminiServings(recipe, newServings) {
  if (!API_KEYS.length) throw new Error("No API key configured.");

  const systemPrompt = `You are SABOR. Adjust recipe servings and return ONLY valid JSON.

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ If adjusting servings would create unsafe ratios or cooking times, explain why briefly and suggest safe alternatives
7. ✅ Decline unsafe requests and suggest safe alternatives

RULES:
1. Scale ALL ingredient quantities proportionally (preserve section headers wrapped in **)
2. Keep instructions; only update serving-specific language if needed
3. Recalculate nutrition PER SERVING if totals are present; otherwise keep per-serving calories unchanged
4. Keep the same title and sources
5. Update "servings" to the new number
6. Return ONLY a complete JSON object in the SAME schema`;

  const userPrompt = `Current recipe:
${JSON.stringify(recipe, null, 2)}

Adjust this recipe from ${recipe.servings} servings to ${newServings} servings.

Return ONLY valid JSON in the EXACT same format with updated quantities.`;

  let lastErr = null;

  for (const apiKey of API_KEYS) {
    for (const modelName of MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });
        const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const text = res?.response?.text?.() ?? "";

        // Be defensive about JSON
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          const m = text.match(/\{[\s\S]*\}/);
          if (m) data = JSON.parse(m[0]);
        }
        if (!data || typeof data !== "object") throw new Error("Model did not return JSON.");

        return normalizeRecipeShape(data);
      } catch (e) {
        lastErr = e;
        // try next combo; keep going on 429/rate-limit or parse issues
        continue;
      }
    }
  }
  throw lastErr || new Error("All keys/models failed.");
}

/* ------------------------------ MATH FALLBACK ----------------------------- */
function mathScaleRecipe(recipe, newServings) {
  const currentServings = Number(recipe?.servings) || 1;
  const factor = (Number(newServings) || 1) / currentServings;

  const copy = JSON.parse(JSON.stringify(recipe || {}));
  const ing = Array.isArray(copy.ingredients) ? copy.ingredients : [];
  copy.ingredients = ing.map((ln) => scaleIngredientLine(String(ln), factor));

  copy.servings = Math.max(1, Math.round(Number(newServings)));
  // Keep calories as per-serving if numeric; we can't reliably recompute totals here.
  if (typeof copy.calories === "number" && isFinite(copy.calories)) {
    // leave as-is (per serving)
  }

  copy.prep = toInt(copy.prep || 0);
  copy.cook = toInt(copy.cook || 0);
  copy.totalTime = Math.max(toInt(copy.totalTime || 0), copy.prep + copy.cook);

  copy.prepTimeDisplay = fmtTime(copy.prep);
  copy.cookTimeDisplay = fmtTime(copy.cook);
  copy.totalTimeDisplay = fmtTime(copy.totalTime);

  copy.changeDescription = `adjusted to ${copy.servings} servings (math fallback)`;

  return normalizeRecipeShape(copy);
}

/* --------------------------------- POST ---------------------------------- */
export async function POST(request) {
  try {
    const { recipe, newServings } = await request.json();

    // Input validation
    if (!recipe || !Array.isArray(recipe.ingredients)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Recipe with ingredients[] is required." },
        { status: 422 }
      );
    }
    if (!Number.isFinite(newServings) || newServings <= 0) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "newServings must be a positive number." },
        { status: 422 }
      );
    }

    // Safety scan (ingredients/title)
    const safe = basicRecipeSafety(recipe);
    if (safe.invalid) {
      const msg =
        safe.reason === "hazmat" ? "Recipe contains hazardous terms." :
        safe.reason === "bio" ? "Recipe contains biological waste terms." :
        "Recipe contains unsafe raw/undercooked terms.";
      return NextResponse.json({ error: "INVALID_RECIPE", message: msg }, { status: 422 });
    }

    // Try Gemini first (nice recalcs); if it fails, do math fallback so UI still updates.
    try {
      const adjusted = await callGeminiServings(recipe, newServings);
      adjusted.changeDescription = `adjusted to ${adjusted.servings} servings`;
      return NextResponse.json(adjusted, { status: 200 });
    } catch (e) {
      console.warn("⚠️ Gemini adjust-servings failed, using math fallback:", e?.message || e);
      const fallback = mathScaleRecipe(recipe, newServings);
      return NextResponse.json(fallback, { status: 200 });
    }
  } catch (error) {
    console.error("❌ /api/adjust-servings error:", error?.message || error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
