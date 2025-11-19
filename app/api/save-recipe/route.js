// app/api/save-recipe/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: Generate embedding for text
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const result = await model.embedContent({
      content: text,
    });

    return result.embedding.values;
  } catch (err) {
    console.error("❌ Embedding error:", err);
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userId,
      recipe,
    } = body;

    // Validate inputs
    if (!userId || !recipe) {
      return NextResponse.json(
        { error: "Missing userId or recipe" },
        { status: 400 }
      );
    }

    if (!recipe.title || !recipe.description) {
      return NextResponse.json(
        { error: "Recipe must have title and description" },
        { status: 400 }
      );
    }

    // Generate embedding from title + description
    const embeddingText = `${recipe.title} ${recipe.description}`;
    
    let embedding;
    try {
      embedding = await generateEmbedding(embeddingText);
      console.log("✅ Embedding generated successfully");
    } catch (embeddingErr) {
      console.error("❌ Embedding generation failed:", embeddingErr.message);
      // Save recipe WITHOUT embedding as fallback
      embedding = null;
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from("saved_recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        servings: recipe.servings || 1,
        calories: recipe.calories?.toString() || "0",
        prep: recipe.prep?.toString() || "0",
        cook: recipe.cook?.toString() || "0",
        serving_size: recipe.servingSize || "1 serving",
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        tools_needed: recipe.toolsNeeded || [],
        nutrition: recipe.nutrition || {},
        sources: recipe.sources || [],
        embedding: embedding, // Can be null if embedding fails
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save recipe", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Recipe saved:", data.id);

    return NextResponse.json(
      {
        success: true,
        recipe: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ /api/save-recipe error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}