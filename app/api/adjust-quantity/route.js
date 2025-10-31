import { generateJSONWithFallback } from '@/lib/gemini-helper';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipe, ingredient, multiplier } = await request.json();
    
    const generationConfig = {
      temperature: 0.8,
    };

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to adjust the quantity of "${ingredient}" by multiplying it by ${multiplier}x.

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ If adjusting quantities would create unsafe ratios or cooking times, explain why and suggest safe alternatives
7. ✅ Decline unsafe requests and suggest safe alternatives

CRITICAL INSTRUCTIONS:
1. Adjust "${ingredient}" to ${multiplier}x the original amount
2. Rebalance other ingredients proportionally if needed to maintain the dish's integrity
3. Update the instructions if the quantity change affects cooking time or method
4. MANDATORY: Recalculate ALL nutrition information:
   - If increasing ingredient by ${multiplier}x, increase its nutritional contribution by ${multiplier}x
   - Update calories, protein, carbs, fat, fiber, sugar, sodium accordingly
   - DO NOT keep old nutrition values - calculate new ones based on the quantity change
5. Keep the same recipe title and format

Return the complete updated recipe with RECALCULATED nutrition in the exact same JSON format.`;

    const updatedRecipe = await generateJSONWithFallback(prompt, generationConfig);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error adjusting quantity:', error);
    return NextResponse.json(
      { error: 'Failed to adjust quantity. All API keys exhausted or error occurred.' },
      { status: 500 }
    );
  }
}