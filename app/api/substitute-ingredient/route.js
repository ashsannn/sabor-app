import { generateJSONWithFallback } from '@/lib/gemini-helper';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipe, ingredientToSubstitute, userPreferences } = await request.json();
    
    console.log('Getting substitutes for:', ingredientToSubstitute);
    
    const generationConfig = {
      temperature: 0.9, // Higher creativity for variety
    };

    // Build user preferences context
    let prefsContext = '';
    if (userPreferences) {
      const prefs = [];
      if (userPreferences.dietary_restrictions?.length) {
        prefs.push(`Dietary restrictions: ${userPreferences.dietary_restrictions.join(', ')}`);
      }
      if (userPreferences.allergies?.length) {
        prefs.push(`Allergies: ${userPreferences.allergies.join(', ')}`);
      }
      if (userPreferences.disliked_ingredients?.length) {
        prefs.push(`Dislikes: ${userPreferences.disliked_ingredients.join(', ')}`);
      }
      if (prefs.length > 0) {
        prefsContext = `\n\nUSER PREFERENCES:\n${prefs.join('\n')}`;
      }
    }

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}
${prefsContext}

The user wants to replace "${ingredientToSubstitute}" in this recipe.

CRITICAL SAFETY RULES - MUST FOLLOW ALWAYS:
1. ❌ NEVER suggest poisonous, toxic, or harmful ingredients
2. ❌ NEVER suggest raw/undercooked high-risk foods
3. ❌ NEVER suggest unsafe ingredient combinations
4. ✅ Only suggest safe, edible substitutes
5. ✅ Respect user's dietary restrictions and allergies
6. ✅ Label allergens in the substitute name if applicable

YOUR TASK:
Generate 3-5 SAFE substitute options for "${ingredientToSubstitute}" that would work well in this recipe.

For each substitute, consider:
- Similar flavor profile or complementary flavors
- Similar texture or cooking properties
- User's dietary preferences and restrictions
- Dietary alternatives (vegan, gluten-free, etc.)
- Common pantry items when possible

Return ONLY a JSON object with an array of substitute options in this exact format:
{
  "options": [
    {
      "ingredient": "Short ingredient name with quantity",
      "reason": "One sentence (max 15 words) explaining why this works"
    }
  ]
}

EXAMPLE for "1 cup butter":
{
  "options": [
    {
      "ingredient": "3/4 cup olive oil",
      "reason": "Healthy fat with mild flavor, great for baking"
    },
    {
      "ingredient": "1 cup coconut oil",
      "reason": "Vegan option with similar texture and subtle sweetness"
    },
    {
      "ingredient": "1 cup applesauce",
      "reason": "Low-fat, adds moisture and natural sweetness to baked goods"
    }
  ]
}

IMPORTANT: Keep the "reason" field SHORT - maximum 15 words, one sentence only.

Generate 3-5 practical, safe substitutes for "${ingredientToSubstitute}" now.`;

    const result = await generateJSONWithFallback(prompt, generationConfig);
    
    console.log('✓ Generated substitutes:', result.options?.length || 0);
    
    // Validate response has options
    if (!result.options || result.options.length === 0) {
      throw new Error('No substitutes generated');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error getting substitutes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get substitute options. All API keys exhausted or error occurred.',
        options: [] 
      },
      { status: 500 }
    );
  }
}