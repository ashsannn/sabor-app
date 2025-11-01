import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ✅ Multi-key rotation for quota fallback
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODELS = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];

export async function POST(request) {
  try {
    const { recipe, originalIngredient, substituteIngredient } = await request.json();

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to replace "${originalIngredient}" with "${substituteIngredient}".

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ If the substitute ingredient is unsafe, decline and suggest a safe alternative
7. ✅ Decline unsafe requests and suggest safe alternatives

CRITICAL INSTRUCTIONS:
1. Replace "${originalIngredient}" with "${substituteIngredient}" in the ingredients list.
   - "${substituteIngredient}" already includes the correct quantity.
   - Use exactly that amount; do not copy the original quantity.
2. Update instructions to reflect the new ingredient.
3. Adjust cooking times or temperatures if necessary.
4. Recalculate ALL nutrition values from scratch.
   - Compare nutritional data for both ingredients.
   - Update calories, protein, carbs, fat, fiber, sugar, sodium.
   - Do NOT copy the old values if profiles differ.
5. Keep the same recipe title, format, and include all original fields (especially "nutrition", "sources", "toolsNeeded").
6. Return ONLY valid JSON for the full updated recipe.`;

    // Try each key and model until success
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
          const updatedRecipe = JSON.parse(text);

          console.log("✅ Substitute generated with model:", modelName);
          console.log("Original nutrition:", recipe.nutrition);
          console.log("Updated nutrition:", updatedRecipe.nutrition);

          // Fallback for missing fields
          updatedRecipe.nutrition = updatedRecipe.nutrition || recipe.nutrition;
          updatedRecipe.sources = updatedRecipe.sources || recipe.sources;
          updatedRecipe.toolsNeeded = updatedRecipe.toolsNeeded || recipe.toolsNeeded;

          return NextResponse.json(updatedRecipe);
        } catch (error) {
          console.warn(`⚠️ Failed with ${modelName} (${apiKey.slice(-4)}): ${error.message}`);
          lastError = error;
          if (error.message.includes("429") || error.message.includes("quota")) continue;
        }
      }
    }

    throw lastError || new Error("All keys/models exhausted or rate-limited.");
  } catch (error) {
    console.error("❌ Error applying substitute:", error);
    return NextResponse.json(
      { error: "Failed to apply substitute.", details: error.message },
      { status: 500 }
    );
  }
}
