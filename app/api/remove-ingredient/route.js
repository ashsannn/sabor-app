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

// ⚡ CHANGED: Use stable model with better quota
const MODELS = ["gemini-2.5-flash"];

const is429 = (msg = "") => /429|too many requests|quota/i.test(msg);

// Define ingredient categories to check against
const CRITICAL_CATEGORIES = {
  proteins: ['chicken', 'beef', 'pork', 'fish', 'tofu', 'tempeh', 'seitan', 'turkey', 'lamb', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'eggs', 'beans', 'lentils', 'chickpeas', 'peanuts'],
  leavening: ['baking soda', 'baking powder', 'yeast', 'soda', 'powder'],
  binders: ['egg', 'eggs', 'cornstarch', 'arrowroot', 'gelatin', 'xanthan gum'],
  flours: ['flour', 'cornmeal', 'almond flour', 'coconut flour', 'buckwheat', 'rice flour', 'gluten-free flour', 'dough'],
  essentialFats: ['oil', 'butter', 'ghee', 'lard', 'coconut oil', 'olive oil', 'vegetable oil']
};

function isCriticalIngredient(ingredientName) {
  const lower = ingredientName.toLowerCase();
  
  for (const category in CRITICAL_CATEGORIES) {
    for (const item of CRITICAL_CATEGORIES[category]) {
      if (lower.includes(item)) {
        return true;
      }
    }
  }
  
  return false;
}

/* ---------------------- PREVIEW ENDPOINT (new) ---------------------- */
export async function PUT(request) {
  try {
    const { recipe, ingredientToRemove } = await request.json();

    if (!recipe || !ingredientToRemove?.trim()) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Provide { recipe, ingredientToRemove }." },
        { status: 422 }
      );
    }

    // First, check against our hardcoded critical list
    let isCritical = isCriticalIngredient(ingredientToRemove);
    console.log(`Ingredient "${ingredientToRemove}" is ${isCritical ? 'CRITICAL' : 'NON-CRITICAL'} (by category)`);

    // Generate impact description only
    const impactPrompt = `You are a culinary expert. Analyze what happens when this ingredient is removed.

Recipe: ${recipe.title}
Ingredient to remove: "${ingredientToRemove}"

Write ONE SHORT SENTENCE (max 20 words) describing what will be MISSING or what will CHANGE in future tense.

Examples:
- "Will lose bright citrus acidity and fresh aroma"
- "Dish will become bland; loses umami depth"
- "Will lose structural binding; texture becomes crumbly"
- "Will miss fresh herbaceous notes and green color"

Return ONLY the sentence, nothing else.`;

    let impactDescription = "";
    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(impactPrompt);
          impactDescription = result.response.text().trim();
          console.log("✅ Impact description generated:", impactDescription);
          break;
        } catch (error) {
          console.warn(`Failed to generate impact: ${error.message}`);
          continue;
        }
      }
      if (impactDescription) break;
    }

    const requiresConfirmation = isCritical;

    return NextResponse.json({
      isCritical,
      impactDescription,
      requiresConfirmation,
    });
  } catch (error) {
    console.error("❌ Error assessing ingredient criticality:", error);
    return NextResponse.json(
      { error: "Failed to assess ingredient.", details: error.message },
      { status: 500 }
    );
  }
}

/* ---------------------- APPLY ENDPOINT (existing) ---------------------- */
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
    const MAX_RETRIES = 1;
    const BASE_DELAY_MS = 2000;

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

            const flavorPrompt = `You are a culinary expert. Analyze the impact of removing this ingredient.

            Recipe: ${recipe.title}
            Removed ingredient: "${ingredientToRemove}"

            Consider:
            - What flavor/texture/aroma does this ingredient contribute?
            - What will be MISSING from the dish without it?
            - How will the overall eating experience change?

            Write ONE SHORT SENTENCE (max 15 words) describing the CONSEQUENCES of removing this ingredient in future tense.

            Examples:
            - "Will lose bright citrus acidity and fresh aroma"
            - "Dish will become bland; loses umami depth"
            - "Will lose structural binding; texture becomes crumbly"
            - "Will miss fresh herbaceous notes and green color"

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