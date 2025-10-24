import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, ingredientToRemove } = await request.json();
    
    console.log('Removing ingredient:', ingredientToRemove);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to REMOVE "${ingredientToRemove}" from this recipe completely.

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const updatedRecipe = JSON.parse(responseText);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error removing ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to remove ingredient' },
      { status: 500 }
    );
  }
}
