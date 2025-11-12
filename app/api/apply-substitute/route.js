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

// ⚡ CHANGED: Use stable model with better quota
const MODELS = ["gemini-2.5-flash"];

/* ---------------------- PREVIEW ENDPOINT (new) ---------------------- */
export async function PUT(request) {
  try {
    const { recipe, originalIngredient, substituteIngredient } = await request.json();

    // Step 1: Assess if this ingredient is CRITICAL in THIS recipe
    const criticalityPrompt = `Recipe: ${recipe.title}
Ingredients:
${(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).join('\n')}

Is "${originalIngredient}" a CRITICAL ingredient in this recipe?

CRITICAL = changing it fundamentally alters the dish (main protein, primary leavening, base fat, primary flavor component)
NON-CRITICAL = cosmetic/garnish/accent (can be swapped without major impact)

Return ONLY: "CRITICAL" or "NON-CRITICAL"
Nothing else, just one word.`;

    let isCritical = false;
    let lastError = null;

    // Check criticality
    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(criticalityPrompt);
          const criticalityResult = result.response.text().trim().toUpperCase();
          
          isCritical = criticalityResult.includes("CRITICAL");
          console.log("✅ Criticality assessed:", criticalityResult);
          break;  // Got result, exit loops
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      if (isCritical !== undefined) break;
    }

    // Step 2: Generate detailed warning/impact assessment
    const previewPrompt = `The user wants to replace "${originalIngredient}" with "${substituteIngredient}" in a ${recipe.title}.

Assess: Is this a MAJOR change that significantly alters the dish, or is it a minor substitution?

Write ONE SHORT WARNING (max 30 words) if it's major. Examples:
- "This transforms it from Mexican to Asian fusion - very different flavor profile"
- "Will make it vegan and change texture significantly"
- "Swaps savory for sweet - completely different dish"

If it's a MINOR substitution (like butter → oil, or chicken → turkey in same dish), just say: "Minor substitution"

Return ONLY the warning message, nothing else.`;

    let warning = "";
    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(previewPrompt);
          warning = result.response.text().trim();
          console.log("✅ Preview generated:", warning);
          break;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      if (warning) break;
    }

    if (!warning) {
      throw lastError || new Error("Preview failed - all keys exhausted.");
    }

    const isMajor = !warning.includes("Minor substitution");
    // Critical ingredient OR major change = requires confirmation
    const requiresConfirmation = isCritical || isMajor;

    return NextResponse.json({
      warning,
      isMajor,
      isCritical,
      requiresConfirmation,
    });
  } catch (error) {
    console.error("❌ Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview.", details: error.message },
      { status: 500 }
    );
  }
}

/* ---------------------- APPLY ENDPOINT (existing) ---------------------- */
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

          // Generate flavor impact description
          const flavorPrompt = `Given this recipe substitution:
          - Replaced: "${originalIngredient}"
          - With: "${substituteIngredient}"

          Write ONE SHORT SENTENCE (max 15 words) describing how this changes the flavor/taste of the dish.
          Example: "Adds tropical sweetness and creamier texture"

          Return ONLY the sentence, nothing else.`;

          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });
            const flavorResult = await model.generateContent(flavorPrompt);
            updatedRecipe.flavorImpact = flavorResult.response.text().trim();
          } catch (err) {
            console.warn("Could not generate flavor impact:", err.message);
            updatedRecipe.flavorImpact = `Substituted ${originalIngredient} with ${substituteIngredient}`;
          }

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