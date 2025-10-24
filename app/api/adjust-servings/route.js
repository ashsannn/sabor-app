import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, newServings } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
    });

    const systemPrompt = `You are SABOR. Adjust recipe servings and return ONLY valid JSON.

RULES:
1. Scale ALL ingredient quantities proportionally
2. Maintain the same recipe structure including section headers (wrapped in **)
3. Keep the same instructions but update any serving-specific language
4. Recalculate nutritional info per serving (total nutrients ÷ new servings)
5. Keep the same sources
6. Update servings, but keep servingSize description similar

Return the COMPLETE recipe with all fields, just with adjusted quantities.`;

    const prompt = `Current recipe:
${JSON.stringify(recipe, null, 2)}

Adjust this recipe from ${recipe.servings} servings to ${newServings} servings.

Return ONLY valid JSON in the EXACT same format with updated quantities.`;

    const result = await model.generateContent([
      systemPrompt,
      prompt
    ]);

    let responseText = result.response.text().trim();
    
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
    return NextResponse.json({ error: 'Failed to adjust servings' }, { status: 500 });
  }
}