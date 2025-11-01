import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ✅ Multi-key rotation
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODELS = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];

const UNITS = [
  "tsp","teaspoon","teaspoons",
  "tbsp","tablespoon","tablespoons",
  "cup","cups",
  "oz","ounce","ounces",
  "g","gram","grams","kg",
  "ml","milliliter","milliliters","l","liter","liters",
  "pinch","pinches","clove","cloves"
];

// Helper: Split “1 tbsp garam masala” → { name: "garam masala", quantity: "1 tbsp" }
function splitQuantityAndName(s) {
  if (!s || typeof s !== "string") return { name: s || "", quantity: "" };
  const text = s.replace(/\s+/g, " ").trim();
  const tokens = text.split(" ");
  let cut = -1;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase().replace(/[.,;:]$/, "");
    if (
      /^[~≈]?\d+(?:\.\d+)?$/.test(t) ||
      /^\d+\/\d+$/.test(t) ||
      ["–","-","to"].includes(t) ||
      UNITS.includes(t)
    ) {
      if (UNITS.includes(t)) {
        cut = i;
        break;
      }
    }
  }
  if (cut !== -1) {
    const quantity = tokens.slice(0, cut + 1).join(" ");
    const name = tokens.slice(cut + 1).join(" ");
    return { name, quantity };
  }
  const dashMatch = text.match(/^(.*?)[-–—]\s*(.*)$/);
  if (dashMatch) {
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();
    const qtyFirst = /^[~≈]?\d|pinch|tsp|tbsp|cup|oz|g|kg|ml|l/i.test(left);
    if (qtyFirst) return { name: right, quantity: left };
    return { name: left, quantity: right };
  }
  return { name: text, quantity: "" };
}

// Normalize response → always { name, quantity, impact }
function normalizeOptions(raw) {
  if (!raw?.options || !Array.isArray(raw.options)) return [];
  return raw.options
    .map((o) => {
      let name = (o.name ?? "").trim();
      let quantity = (o.quantity ?? "").trim();
      const impact = (o.impact ?? o.reason ?? "").trim();

      if (!name && o.ingredient) {
        const split = splitQuantityAndName(o.ingredient);
        name = split.name;
        quantity = quantity || split.quantity;
      }

      if (!name && o.ingredient && !quantity && o.quantity) {
        name = String(o.ingredient);
        quantity = String(o.quantity);
      }

      name = (name || "").trim();
      quantity = (quantity || "").trim();

      if (!name && !quantity && !impact) return null;
      return { name, quantity, impact };
    })
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const { recipe, ingredientToSubstitute, userPreferences } = await request.json();
    console.log("🔍 Getting substitutes for:", ingredientToSubstitute);

    // Build user preferences context
    let prefsContext = "";
    if (userPreferences) {
      const prefs = [];
      if (userPreferences.dietary_restrictions?.length)
        prefs.push(`Dietary restrictions: ${userPreferences.dietary_restrictions.join(", ")}`);
      if (userPreferences.allergies?.length)
        prefs.push(`Allergies: ${userPreferences.allergies.join(", ")}`);
      if (userPreferences.disliked_ingredients?.length)
        prefs.push(`Dislikes: ${userPreferences.disliked_ingredients.join(", ")}`);
      if (prefs.length > 0) prefsContext = `\n\nUSER PREFERENCES:\n${prefs.join("\n")}`;
    }

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}
${prefsContext}

The user wants to replace "${ingredientToSubstitute}" in this recipe.

CRITICAL SAFETY RULES:
1) ❌ Never suggest poisonous, toxic, or unsafe ingredients.
2) ❌ Never suggest raw or undercooked high-risk foods.
3) ✅ Respect all dietary restrictions and allergies.
4) ✅ Clearly indicate if a substitute changes flavor, texture, or color.

TASK:
Propose 4–6 SAFE substitute options that would work well in this recipe.

For each substitute, include:
- "name": ingredient name only
- "quantity": exact amount (e.g. "1 tbsp each")
-  Do NOT reuse the original ingredient’s quantity unless it is truly equivalent.
- "impact": short explanation (max 15 words) of how this substitution changes the recipe’s flavor, texture, or outcome

Return ONLY valid JSON like this:
{
  "options": [
    {
      "name": "Smoked paprika",
      "quantity": "1.25 tbsp",
      "impact": "Adds depth and smoky warmth similar to tandoori flavor"
    }
  ]
}`;

    let lastError = null;

    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.8,
            },
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();

          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch {
            throw new Error("Invalid JSON from model");
          }

          const options = normalizeOptions(parsed);
          if (!options.length) throw new Error("Model returned no options");

          console.log(`✅ Substitutes generated with ${modelName}: ${options.length}`);
          return NextResponse.json({ options });
        } catch (error) {
          console.warn(`⚠️ Failed with ${modelName} (${apiKey.slice(-4)}): ${error.message}`);
          lastError = error;
          if (String(error.message).includes("429") || String(error.message).includes("quota"))
            continue;
        }
      }
    }

    throw lastError || new Error("All keys/models exhausted or failed");
  } catch (error) {
    console.error("❌ Error getting substitutes:", error);
    return NextResponse.json(
      { error: "Failed to get substitute options.", options: [], details: error.message },
      { status: 500 }
    );
  }
}
