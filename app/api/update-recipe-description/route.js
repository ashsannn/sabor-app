import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

const MODELS = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];

const is429 = (msg = "") => /429|too many requests|quota/i.test(msg);

export async function POST(request) {
  try {
    const { originalRecipe, modifiedRecipe, originalTitle, originalDescription } = await request.json();

    if (!modifiedRecipe || !originalTitle || !originalDescription) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Provide { originalRecipe, modifiedRecipe, originalTitle, originalDescription }." },
        { status: 422 }
      );
    }

    const prompt = `You are a culinary expert. Update a recipe's title and description based on modifications made.

ORIGINAL RECIPE:
${JSON.stringify(originalRecipe, null, 2)}

MODIFIED RECIPE:
${JSON.stringify(modifiedRecipe, null, 2)}

ORIGINAL TITLE: "${originalTitle}"
ORIGINAL DESCRIPTION: "${originalDescription}"

YOUR TASK:
1. Analyze what changed between original and modified recipe
2. Update the TITLE intelligently but KEEP IT SHORT (max 8 words)
   - If major ingredient removed, reflect that
   - If key ingredient added/increased, highlight it
   - Keep the core essence
3. Rewrite the DESCRIPTION to match the modified recipe
   - Keep similar length and tone as original
   - Make it accurate to what's now in the recipe
   - Sound natural, not like a list of changes

Return ONLY valid JSON in this exact format:
{
  "title": "Updated short title here",
  "description": "Updated description here"
}`;

    let lastError = null;

    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" },
          });

          const result = await model.generateContent(prompt);
          const text = result?.response?.text?.() ?? "";

          let updates;
          try {
            updates = JSON.parse(text);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) throw new Error("Model did not return valid JSON");
            updates = JSON.parse(match[0]);
          }

          if (!updates.title || !updates.description) {
            throw new Error("Missing title or description in response");
          }

          return NextResponse.json(updates, { status: 200 });
        } catch (err) {
          lastError = err;
          const msg = err?.message || String(err);
          console.warn(`⚠️ Failed with ${modelName}: ${msg}`);

          if (is429(msg)) {
            continue;
          }
        }
      }
    }

    throw lastError || new Error("All keys/models exhausted or rate-limited.");
  } catch (error) {
    console.error("Error updating recipe description:", error);
    return NextResponse.json(
      {
        error: "Failed to update recipe description.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}