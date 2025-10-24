import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { recipe, ingredientToSubstitute } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You have this recipe:
${JSON.stringify(recipe, null, 2)}

The user wants to substitute "${ingredientToSubstitute}" with something else.

Please provide 4-5 good substitute options for this ingredient. For each option:
1. Include the substitute ingredient name with the CORRECT ADJUSTED quantity - do NOT just use the same amount as the original. Consider the density, intensity, and characteristics of the substitute.
2. Adjust measurements appropriately (e.g., if substituting butter with oil, use less oil since it's more liquid)
3. Provide a brief description of how it changes the dish

Examples of proper adjustments:
- 1 cup butter → 3/4 cup oil (oil is more concentrated)
- 1 cup fresh herbs → 1/3 cup dried herbs (dried are more potent)
- 1 cup white sugar → 3/4 cup honey (honey is sweeter)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "options": [
    {
      "ingredient": "3/4 cup coconut oil",
      "description": "Adds tropical flavor. Using less since oil is more concentrated than butter."
    }
  ]
}

Make the substitutes practical with properly adjusted measurements.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Raw response:', responseText);
    const data = JSON.parse(responseText);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting substitute options:', error);
    return NextResponse.json(
      { error: 'Failed to get substitute options' },
      { status: 500 }
    );
  }
}
