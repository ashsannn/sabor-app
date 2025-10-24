import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, ingredient, multiplier } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to adjust the quantity of "${ingredient}" by multiplying it by ${multiplier}x.

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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const updatedRecipe = JSON.parse(responseText);
    
    console.log('Original nutrition:', recipe.nutrition);
    console.log('Updated nutrition:', updatedRecipe.nutrition);

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error adjusting quantity:', error);
    return NextResponse.json(
      { error: 'Failed to adjust quantity' },
      { status: 500 }
    );
  }
}
