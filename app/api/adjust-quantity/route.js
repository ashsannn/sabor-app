import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/* ---------------- helpers ---------------- */
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODEL = "gemini-2.0-flash-exp";
const unicodeFrac = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1/3, '⅔': 2/3 };

function parseQuantity(q) {
  if (typeof q === 'number') return q;
  if (typeof q !== 'string') return NaN;
  let total = 0;
  for (const tok of q.trim().split(/\s+/)) {
    if (!tok) continue;
    if (unicodeFrac[tok] != null) { total += unicodeFrac[tok]; continue; }
    if (/^\d+\/\d+$/.test(tok)) { const [a,b] = tok.split('/').map(Number); if (b) total += a/b; continue; }
    const n = parseFloat(tok.replace(/[^0-9.\-]/g, ''));
    if (!Number.isNaN(n)) total += n;
  }
  return Number.isFinite(total) ? total : NaN;
}

function toHalfStep(n) {
  if (!isFinite(n)) return n;
  const r = Math.round((n + Number.EPSILON) / 0.5) * 0.5;
  return Math.max(0, +r.toFixed(2));
}

function formatHalf(qty) {
  const whole = Math.trunc(qty);
  const frac = +(qty - whole).toFixed(2);
  if (whole === 0 && frac === 0.5) return '½';
  if (frac === 0.5 && whole > 0) return `${whole} ½`;
  return `${whole}`;
}

/** Adjust a specific ingredient by a ±0.5 *steps* delta (e.g., +1.5, -0.5). */
function applyHalfStepAdjustment(recipe, ingredientName, deltaSteps) {
  if (!recipe || !Array.isArray(recipe.ingredients)) return recipe;

  const delta = (typeof deltaSteps === 'number' ? deltaSteps : 0) * 0.5;

  const updated = { ...recipe };
  updated.ingredients = recipe.ingredients.map((ing) => {
    const match = (ing.name || '').toLowerCase().includes(String(ingredientName).toLowerCase());
    if (!match) return ing;

    const base = typeof ing.quantity === 'number' ? ing.quantity : parseQuantity(ing.quantity);
    if (Number.isNaN(base)) return ing;

    const next = toHalfStep(base + delta);
    return {
      ...ing,
      quantity: next,                 // numeric for math
      displayQuantity: formatHalf(next), // pretty for UI
    };
  });

  updated.change = {
    type: 'quantity-adjusted',
    ingredient: ingredientName,
    delta, // e.g. +1.5 => +0.75 cups if unit were cups; here it's the numeric add
    at: new Date().toISOString(),
  };

  return updated;
}

/* ---------------- route ---------------- */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Accept either {action:'increase'|'decrease'} or {deltaSteps:number} or {multiplier:number}
    let { recipe, ingredient, action, deltaSteps, multiplier } = body;

    if (!recipe || !ingredient) {
      return NextResponse.json(
        { error: "Missing fields: provide { recipe, ingredient }." },
        { status: 422 }
      );
    }

    // Normalize delta: if action given, map to ±1 step; if multiplier given, we’ll post-process.
    if (typeof deltaSteps !== 'number') {
      if (action === 'increase') deltaSteps = 1;
      else if (action === 'decrease') deltaSteps = -1;
      else deltaSteps = 0;
    }

    // 1) Do the math locally (snap to 0.5 grid)
    let interimRecipe = applyHalfStepAdjustment(recipe, ingredient, deltaSteps);

    // If a legacy multiplier was sent, reapply on top (but still snap to 0.5)
    if (typeof multiplier === 'number' && isFinite(multiplier) && multiplier !== 1) {
      interimRecipe = {
        ...interimRecipe,
        ingredients: interimRecipe.ingredients.map((ing) => {
          const match = (ing.name || '').toLowerCase().includes(String(ingredient).toLowerCase());
          if (!match) return ing;
          const base = typeof ing.quantity === 'number' ? ing.quantity : parseQuantity(ing.quantity);
          if (Number.isNaN(base)) return ing;
          const next = toHalfStep(base * multiplier);
          return { ...ing, quantity: next, displayQuantity: formatHalf(next) };
        }),
      };
    }

    // 2) Ask Gemini to REGENERATE the full recipe using the already-updated ingredients.
    const apiKey = API_KEYS[0];
    if (!apiKey) {
      // Fallback: return the locally-updated recipe if no key
      return NextResponse.json({ ...interimRecipe, _note: "No Gemini key found; returned locally-updated recipe." }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const regenPrompt = `You are given an UPDATED recipe JSON (ingredients already include the new quantities).
You must return a complete recipe JSON with:
- SAME title
- ingredients list: **USE EXACTLY the given quantities** (do NOT change them)
- instructions updated if needed to reflect timing/method changes
- nutrition fully recalculated from the updated ingredients
- keep the same overall schema/fields as the input (include servings if present)
- add an optional "notes" array if you believe any flavor balance adjustments might help, but DO NOT alter the ingredient amounts

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ If adjustments would create unsafe ratios or cooking times, explain why in "notes" and propose safe alternatives
7. ✅ Decline unsafe requests and suggest safe alternatives if needed

MANDATORY:
- DO NOT modify the ingredient *quantities* I provide below.
- Recalculate nutrition (calories, protein, carbs, fat, fiber, sugar, sodium) based on these exact quantities.
- Return ONLY JSON.

UPDATED RECIPE JSON:
${JSON.stringify(interimRecipe, null, 2)}
`;

    const result = await model.generateContent(regenPrompt);
    const text = result?.response?.text?.() ?? "";

    // Robust parse; if it fails, fall back to interim
    let regenerated;
    try {
      regenerated = JSON.parse(text);
    } catch {
      regenerated = { ...interimRecipe, _note: "Model returned non-JSON; served locally-updated recipe." };
    }

    return NextResponse.json(regenerated, { status: 200 });
  } catch (error) {
    console.error("adjust-quantity hybrid error:", error);
    // last-resort: respond 500
    return NextResponse.json(
      { error: "Failed to adjust/regenerate recipe.", details: error.message },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
