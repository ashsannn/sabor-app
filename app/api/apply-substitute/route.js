import { generateJSONWithFallback } from '@/lib/gemini-helper';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipe, originalIngredient, substituteIngredient } = await request.json();
    
    const generationConfig = {
      temperature: 0.8,
    };

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
1. Replace "${originalIngredient}" with "${substituteIngredient}" in the ingredients list
   - IMPORTANT: "${substituteIngredient}" already includes the correct quantity (e.g., "3/4 cup olive oil")
   - Use the EXACT quantity specified in "${substituteIngredient}" - do NOT keep the original quantity
   - Example: If original is "1 cup butter" and substitute is "3/4 cup olive oil", use "3/4 cup olive oil" (NOT "1 cup olive oil")
2. Update the instructions to use the substitute ingredient
3. Adjust cooking times or temperatures if needed for the substitute
4. MANDATORY: You MUST recalculate ALL nutrition values from scratch:
   - Look up the nutritional content of "${substituteIngredient}"
   - Look up the nutritional content of "${originalIngredient}"
   - Calculate the difference
   - Update ALL fields in the nutrition object: calories, protein, carbs, fat, fiber, sugar, sodium
   - The nutrition values MUST be different from the original if the ingredients have different nutritional profiles
   - DO NOT copy the old nutrition values - calculate new ones
5. Keep the same recipe title and format
6. IMPORTANT: You MUST include ALL fields from the original recipe in your response, especially the "nutrition" object

NUTRITION EXAMPLE:
If replacing "1 cup butter (810 cal, 92g fat)" with "3/4 cup olive oil (1440 cal, 162g fat)":
- Original total calories: 450
- New total calories should be: 450 - 810 + 1440 = 1080 (recalculated)

Return the complete updated recipe with RECALCULATED nutrition values in the exact same JSON format. Do NOT omit any fields.`;

    const updatedRecipe = await generateJSONWithFallback(prompt, generationConfig);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    // Validate that critical fields exist
    if (!updatedRecipe.nutrition) {
      console.warn('⚠️ AI did not return nutrition, keeping original nutrition');
      updatedRecipe.nutrition = recipe.nutrition;
    }
    
    if (!updatedRecipe.sources) {
      console.warn('⚠️ AI did not return sources, keeping original sources');
      updatedRecipe.sources = recipe.sources;
    }
    
    if (!updatedRecipe.toolsNeeded) {
      console.warn('⚠️ AI did not return toolsNeeded, keeping original tools');
      updatedRecipe.toolsNeeded = recipe.toolsNeeded;
    }

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error applying substitute:', error);
    return NextResponse.json(
      { error: 'Failed to apply substitute. All API keys exhausted or error occurred.' },
      { status: 500 }
    );
  }
}