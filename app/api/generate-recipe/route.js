import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  let responseText = '';
  try {
    const { prompt } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
    });

    const systemPrompt = `You are SABOR. Generate recipes as valid JSON.

INGREDIENT FORMATTING RULES:
- If a recipe has multiple components (like sauce, filling, topping), use section headers
- Section headers should NOT have bullets - they're formatted as text with ** around them
- Regular ingredients under each section should be plain text
- Example: ["**For the Sauce:**", "1 cup tomatoes", "2 cloves garlic", "**For the Filling:**", "1 lb chicken"]

CRITICAL SOURCING RULES:
1. ALWAYS cite 3-5 REAL, SPECIFIC recipe sources
2. URLs must be ACTUAL recipe pages, not just homepages
3. Each source must be a specific recipe or article that inspired THIS recipe
4. Include the exact page where the recipe/technique came from
5. NEVER cite "SABOR" or make up fake sources
6. Be honest about what inspired each part of the recipe

Example of GOOD sources (specific URLs):
{
  "name": "Maangchi's Sundubu-jjigae",
  "type": "Traditional recipe inspiration",
  "url": "https://www.maangchi.com/recipe/sundubu-jjigae"
}

Format:
{
  "title": "Recipe name",
  "servings": 4,
  "calories": 320,
  "servingSize": "1 cup",
  "time": "30 mins",
  "prep": "10 mins",
  "cook": "20 mins",
  "ingredients": ["**For the Sauce:**", "1 cup item", "**For the Main:**", "2 cups item"],
  "instructions": ["Step 1", "Step 2"],
  "toolsNeeded": ["Tool 1", "Tool 2"],
  "nutrition": {"protein": "18g", "carbs": "45g", "fat": "8g", "fiber": "12g", "sugar": "6g", "sodium": "580mg"},
  "sources": [
    {"name": "Specific Recipe Title", "type": "What it contributed", "url": "https://exact-url.com/recipe"},
    {"name": "USDA FoodData Central", "type": "Nutritional data", "url": "https://fdc.nal.usda.gov/"}
  ]
}

Use section headers when recipes have multiple components.`;

    const result = await model.generateContent([
      systemPrompt,
      `Generate a recipe for: ${prompt}\n\nReturn ONLY valid JSON. Include 3-5 sources with SPECIFIC recipe page URLs.`
    ]);

    responseText = result.response.text().trim();
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```$/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '').replace(/```$/g, '');
    }
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    responseText = responseText
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\n\s*\w+\s*\]/g, ']')
      .replace(/\]\s*"[^"]*"\s*\]/g, ']');
    
    const recipe = JSON.parse(responseText);
    
    if (!recipe.sources || recipe.sources.length < 3) {
      console.warn('⚠️ Insufficient sources:', recipe.sources?.length || 0);
    }
    
    console.log('✓ Recipe:', recipe.title);
    console.log('✓ Sources:', recipe.sources?.map(s => s.url) || []);
    
    return NextResponse.json(recipe);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 });
  }
}
