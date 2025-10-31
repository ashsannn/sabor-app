import { generateWithFallback } from '@/lib/gemini-helper';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipe, newServings } = await request.json();

    const systemPrompt = `You are SABOR. Adjust recipe servings and return ONLY valid JSON.

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients (raw kidney beans, raw elderberries, bitter almonds, improperly prepared cassava)
2. ❌ NEVER include raw/undercooked high-risk foods (raw chicken, raw pork, raw eggs for vulnerable populations, undercooked ground meat)
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Label all allergens (nuts, shellfish, dairy, eggs, soy, gluten, fish, sesame)
5. ✅ Follow safe cooking temperatures (chicken 165°F, ground meat 160°F)
6. ✅ If adjusting servings would create unsafe ratios or cooking times, explain why and suggest safe alternatives
7. ✅ Decline unsafe requests and suggest safe alternatives

RULES:
1. Scale ALL ingredient quantities proportionally
2. Maintain the same recipe structure including section headers (wrapped in **)
3. Keep the same instructions but update any serving-specific language
4. Recalculate nutritional info per serving (total nutrients ÷ new servings)
5. Keep the same sources
6. Update servings, but keep servingSize description similar

Return the COMPLETE recipe with all fields, just with adjusted quantities.`;

    const userPrompt = `Current recipe:
${JSON.stringify(recipe, null, 2)}

Adjust this recipe from ${recipe.servings} servings to ${newServings} servings.

Return ONLY valid JSON in the EXACT same format with updated quantities.`;

    // Combine prompts for the helper
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    let responseText = await generateWithFallback(combinedPrompt, {});
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```$/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '').replace(/```$/g, '');
    }
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    const adjustedRecipe = JSON.parse(responseText);
    
    console.log('✓ Adjusted servings:', recipe.servings, '→', adjustedRecipe.servings);
    
    return NextResponse.json(adjustedRecipe);
    
  } catch (error) {
    console.error('❌ Error adjusting servings:', error.message);
    return NextResponse.json({ error: 'Failed to adjust servings. All API keys exhausted or error occurred.' }, { status: 500 });
  }
}