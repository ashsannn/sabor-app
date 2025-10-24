import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, newServings } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You have this recipe for ${recipe.servings} servings:
${JSON.stringify(recipe, null, 2)}

The user wants to adjust it to ${newServings} servings.

CRITICAL INSTRUCTIONS:
1. Scale ALL ingredient quantities proportionally from ${recipe.servings} to ${newServings} servings
2. Update the servings field to ${newServings}
3. IMPORTANT: The "calories" field MUST remain exactly ${recipe.calories} - this is calories PER SERVING and does not change when scaling
4. The "servingSize" field should stay exactly "${recipe.servingSize}" - portion size doesn't change when making more servings
5. Cooking times (prep, cook, time) should generally stay the same - only increase if batch is 3x+ larger
6. Keep the exact same recipe title and format

Return the complete updated recipe scaled to ${newServings} servings in the exact same JSON format.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const updatedRecipe = JSON.parse(responseText);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error adjusting servings:', error);
    return NextResponse.json(
      { error: 'Failed to adjust servings' },
      { status: 500 }
    );
  }
}