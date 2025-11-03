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

const MODELS = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];
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

function parseIngredientString(ingStr) {
  const match = ingStr.match(/^([\d\s\/\.½¼¾⅓⅔]*)\s*([a-z]+(?:\s+[a-z]+)?)\s+(.+)$/i);
  if (match) {
    return {
      quantity: match[1].trim(),
      unit: match[2].trim(),
      name: match[3].trim(),
    };
  }
  return { quantity: '', unit: '', name: ingStr };
}

/** Adjust a specific ingredient by a ±0.5 *steps* delta (e.g., +1.5, -0.5). */
function applyHalfStepAdjustment(recipe, ingredientName, deltaSteps) {
  if (!recipe || !Array.isArray(recipe.ingredients)) return recipe;

  const delta = (typeof deltaSteps === 'number' ? deltaSteps : 0) * 0.5;

  const updated = { ...recipe };
  updated.ingredients = recipe.ingredients.map((ing) => {
    let ingObj = typeof ing === 'string' ? parseIngredientString(ing) : ing;
    const match = (ingObj.name || '').toLowerCase().includes(String(ingredientName).toLowerCase());
    if (!match) return ing;

    const base = typeof ingObj.quantity === 'number' ? ingObj.quantity : parseQuantity(ingObj.quantity);
    if (Number.isNaN(base)) return ing;

    const next = toHalfStep(base + delta);
    const formatted = formatHalf(next);
    
    // Return as object with separated fields
    return {
      quantity: next,
      displayQuantity: formatted,
      unit: ingObj.unit || '',
      name: ingObj.name || ingredientName,
    };
  });

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
    // Try all keys and models
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

    let regenerated = null;
    let regenerateSuccess = false;

    for (const apiKey of API_KEYS) {
      if (regenerateSuccess) break;
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" },
          });

          const result = await model.generateContent(regenPrompt);
          const text = result?.response?.text?.() ?? "";

          try {
            regenerated = JSON.parse(text);
            regenerateSuccess = true;
            break;
          } catch {
            regenerated = { ...interimRecipe, _note: "Model returned non-JSON; served locally-updated recipe." };
            regenerateSuccess = true;
            break;
          }
        } catch (err) {
          console.warn(`Failed with model ${modelName}: ${err.message}`);
          continue;
        }
      }
    }

    if (!regenerateSuccess) {
      regenerated = { ...interimRecipe, _note: "All models failed; served locally-updated recipe." };
    }

    // Generate flavor impact description - try all keys and models
    const ingredientName = String(ingredient).split(',')[0];
    const direction = deltaSteps > 0 ? 'increasing' : 'decreasing';
    
    // Smart flavor impact prompt - analyze the ingredient to predict flavor changes
    const flavorPrompt = `You are a culinary expert. Given this ingredient adjustment, describe the flavor impact in ONE SHORT SENTENCE (max 15 words).

Ingredient: "${ingredientName}"
Direction: ${direction} the amount

Consider:
- What flavor notes does this ingredient have? (sweet, savory, spicy, sour, bitter, umami, etc.)
- How does increasing/decreasing it affect the dish's overall taste profile?
- Be specific about the flavor change, not just "added more"

Examples:
- Increasing garlic → "More pungent, savory depth"
- Decreasing salt → "Lighter, less savory; subtle flavors emerge"
- Increasing lemon → "Brighter acidity, more citrus pop"
- Decreasing sugar → "Less sweet, more complex bitter notes"

Return ONLY one sentence, nothing else.`;

    let flavorGenerated = false;
    for (const apiKey of API_KEYS) {
      if (flavorGenerated) break;
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });
          const flavorResult = await model.generateContent(flavorPrompt);
          regenerated.flavorImpact = flavorResult.response.text().trim();
          flavorGenerated = true;
          break;
        } catch (err) {
          if (err.message.includes('429')) {
            console.warn(`Model ${modelName} rate-limited, trying next...`);
            continue;
          }
          console.warn(`Could not generate flavor impact with ${modelName}: ${err.message}`);
        }
      }
    }
    
    if (!flavorGenerated) {
      regenerated.flavorImpact = `${direction.charAt(0).toUpperCase() + direction.slice(1)} ${ingredientName}`;
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