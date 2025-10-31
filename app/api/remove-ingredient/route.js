import { generateJSONWithFallback } from '@/lib/gemini-helper';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipe, ingredientToRemove } = await request.json();
    
    console.log('Removing ingredient:', ingredientToRemove);
    
    const generationConfig = {
      temperature: 0.8,
    };

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

    const updatedRecipe = await generateJSONWithFallback(prompt, generationConfig);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error removing ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to remove ingredient. All API keys exhausted or error occurred.' },
      { status: 500 }
    );
  }
}