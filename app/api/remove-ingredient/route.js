import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 25;

// Rotate across available Gemini API keys
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODELS = [
  (process.env.GEMINI_MODEL || "").trim() || "gemini-2.0-flash-exp",
  "gemini-2.0-pro-exp",
];

const is429 = (msg = "") => /429|too many requests|quota/i.test(msg);

export async function POST(request) {
  try {
    const { recipe, ingredientToRemove } = await request.json();

    if (!recipe || !ingredientToRemove?.trim()) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Provide { recipe, ingredientToRemove }." },
        { status: 422 }
      );
    }

    console.log("Removing ingredient:", ingredientToRemove);

    const generationConfig = { temperature: 0.8 };

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to REMOVE "${ingredientToRemove}" from this recipe completely.

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ Decline unsafe requests and suggest safe alternatives

CRITICAL INSTRUCTIONS:
1. Remove "${ingredientToRemove}" from the ingredients list
2. Adjust the instructions to work without this ingredient
3. Maintain the overall dish concept and flavor profile as much as possible
4. MANDATORY: Recalculate ALL nutrition information:
   - Subtract the nutritional contribution of "${ingredientToRemove}"
   - Update calories, protein, carbs, fat, fiber, sugar, sodium
   - The nutrition MUST be lower than before since you're removing an ingredient
   - DO NOT keep old nutrition values
5. Keep the same recipe title and format

Return the complete updated recipe WITHOUT the removed ingredient and with RECALCULATED nutrition.`;

    let lastError = null;
    const MAX_RETRIES = 2;
    const BASE_DELAY_MS = 800;

    // Try each API key and model combination
    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { ...generationConfig, responseMimeType: "application/json" },
            });

            const result = await model.generateContent(prompt);
            const text = result?.response?.text?.() ?? "";

            // Handle JSON parsing (strip code fences if needed)
            let updatedRecipe;
            try {
              updatedRecipe = JSON.parse(text);
            } catch {
              const match = text.match(/\{[\s\S]*\}/);
              if (!match) throw new Error("Model did not return valid JSON");
              updatedRecipe = JSON.parse(match[0]);
            }

            console.log("Original nutrition:", recipe.nutrition);
            console.log("Updated nutrition:", updatedRecipe.nutrition);

            // Generate flavor impact description
            const flavorPrompt = `Given this recipe change:
            - Removed ingredient: "${ingredientToRemove}"

            Write ONE SHORT SENTENCE (max 15 words) describing how removing this changes the flavor/taste of the dish.
            Example: "Lighter, less savory profile"

            Return ONLY the sentence, nothing else.`;

            try {
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: modelName });
              const flavorResult = await model.generateContent(flavorPrompt);
              updatedRecipe.flavorImpact = flavorResult.response.text().trim();
            } catch (err) {
              console.warn("Could not generate flavor impact:", err.message);
              updatedRecipe.flavorImpact = `Removed ${ingredientToRemove}`;
            }

            return NextResponse.json(updatedRecipe);

            
            
          } catch (error) {
            lastError = error;
            const msg = error?.message || String(error);
            console.warn(`⚠️ Failed with ${modelName} (${apiKey.slice(-4)}), attempt ${attempt + 1}: ${msg}`);

            if (is429(msg) && attempt < MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
              continue;
            }
          }
        }
      }
    }

    throw lastError || new Error("All keys/models exhausted or rate-limited.");
  } catch (error) {
    console.error("Error removing ingredient:", error);
    return NextResponse.json(
      {
        error: "Failed to remove ingredient.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
