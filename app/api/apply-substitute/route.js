import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, originalIngredient, substituteIngredient } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to replace "${originalIngredient}" with "${substituteIngredient}".

CRITICAL INSTRUCTIONS:
1. Replace "${originalIngredient}" with "${substituteIngredient}" in the ingredients list
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

NUTRITION EXAMPLE:
If replacing "1 cup butter (810 cal, 92g fat)" with "3/4 cup olive oil (1440 cal, 162g fat)":
- Original total calories: 450
- New total calories should be: 450 - 810 + 1440 = 1080 (recalculated)

Return the complete updated recipe with RECALCULATED nutrition values in the exact same JSON format.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const updatedRecipe = JSON.parse(responseText);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error applying substitute:', error);
    return NextResponse.json(
      { error: 'Failed to apply substitute' },
      { status: 500 }
    );
  }
}
