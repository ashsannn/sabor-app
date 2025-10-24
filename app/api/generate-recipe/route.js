import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  let responseText = '';
  try {
    const { prompt } = await request.json();
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
    });

    const systemPrompt = `You are SABOR. Generate recipes as valid JSON.

INGREDIENT FORMATTING RULES:
- If a recipe has multiple components (like sauce, filling, topping), use section headers
- Section headers should NOT have bullets - they're formatted as text with ** around them
- Regular ingredients under each section should be plain text
- Example: ["**For the Sauce:**", "1 cup tomatoes", "2 cloves garlic", "**For the Filling:**", "1 lb chicken"]

CRITICAL SOURCING RULES - HIGHEST PRIORITY:
You MUST cite 3-5 REAL, CULTURALLY AUTHENTIC, VETTED sources. This is extremely important for credibility.

CULTURAL SOURCE GUIDELINES BY CUISINE:
- **Korean:** Maangchi (maangchi.com), Korean Bapsang (koreanbapsang.com), My Korean Kitchen (mykoreankitchen.com), Seonkyoung Longest (seonkyounglongest.com)
- **Mexican:** Pati Jinich (patijinich.com), Rick Bayless (rickbayless.com), Mexico in My Kitchen (mexicoinmykitchen.com)
- **Indian:** Veg Recipes of India (vegrecipesofindia.com), Swasthi's Recipes (indianhealthyrecipes.com), Hebbar's Kitchen (hebbarskitchen.com), Archana's Kitchen (archanaskitchen.com)
- **Japanese:** Just One Cookbook (justonecookbook.com), Chopstick Chronicles (chopstickchronicles.com), RecipeTin Japan (recipetinjapan.com)
- **Italian:** Giallo Zafferano (giallozafferano.com), La Cucina Italiana (lacucinaitaliana.com)
- **Thai:** Hot Thai Kitchen (hotthaikitchen.com), She Simmers (shesimmers.com), Temple of Thai (templeofthai.com)
- **Ethiopian:** Teff Love, Meskerem
- **Middle Eastern:** Ottolenghi (ottolenghi.co.uk), Maureen Abood (maureensabood.com), Silk Road Recipes (silkroadrecipes.com)
- **Chinese:** Woks of Life (thewoksoflife.com), China Sichuan Food (chinasichuanfood.com), Red House Spice (redhousespice.com)
- **Vietnamese:** Viet World Kitchen (vietworldkitchen.com), Luke Nguyen (lukenguyencookbook.com)
- **Persian:** Persian Mama (persianmama.com), Turmeric & Saffron (turmericandsaffron.com)
- **Lebanese/Mediterranean:** Maureen Abood (maureensabood.com), Cleobuttera (cleobuttera.com), Feel Good Foodie (feelgoodfoodie.net)
- **Latin American:** Laylita's Recipes (laylita.com), Amigofoods (amigofoods.com)

FOR TECHNIQUES & NUTRITION:
- Serious Eats (seriouseats.com), America's Test Kitchen (americastestkitchen.com), King Arthur Baking (kingarthurbaking.com)
- USDA FoodData Central (fdc.nal.usda.gov)

SOURCING REQUIREMENTS:
1. For ethnic/cultural recipes, AT LEAST 2 sources MUST be from cultural authorities (native bloggers, cultural recipe sites)
2. Source names should include the person's name when it's a personal blog (e.g., "Maangchi's Sundubu-jjigae technique")
3. Be specific about what inspired each element (e.g., "Maangchi's broth technique", "Rick Bayless's mole spice blend")
4. Mix: 2-3 cultural/authentic + 1 technique + 1 nutrition source
5. NEVER cite "SABOR" or generic/made-up sources
6. URLs should be the HOMEPAGE of the source (e.g., https://maangchi.com, https://hotthaikitchen.com) - users can explore from there
7. If you don't know authentic sources for a cuisine, prioritize Serious Eats or similar reputable cooking sites

Example of EXCELLENT culturally authentic sourcing for Korean recipe:
{
  "name": "Maangchi's Sundubu-jjigae technique",
  "type": "Traditional Korean recipe and broth method",
  "url": "https://maangchi.com"
}
{
  "name": "Korean Bapsang's ingredient ratios",
  "type": "Authentic Korean cooking guidance",
  "url": "https://koreanbapsang.com"
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
    {"name": "Specific Cultural Expert/Recipe", "type": "What it contributed", "url": "https://website.com"},
    {"name": "USDA FoodData Central", "type": "Nutritional data", "url": "https://fdc.nal.usda.gov"}
  ]
}

PRIORITY: Culturally authentic sources are MORE important than perfect URLs. Focus on credible, real people and organizations from the culture of origin.`;

    const result = await model.generateContent([
      systemPrompt,
      `Generate a recipe for: ${prompt}\n\nReturn ONLY valid JSON. Include 3-5 sources - AT LEAST 2 must be culturally authentic sources from the cuisine's culture of origin (use the cultural source guidelines provided). Be specific about what each source contributed (technique, spice blend, ingredient ratios, etc.).`
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