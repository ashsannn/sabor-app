// app/api/search-recipes/route.js
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

// Helper: Calculate cosine similarity
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, searchQuery, threshold = 0.9 } = body;

    // Validate inputs - userId is now optional
    if (!searchQuery) {
      return NextResponse.json(
        { error: "Missing searchQuery" },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for: "${searchQuery}" (threshold: ${threshold}, userId: ${userId || 'public'})`);

    // Step 1: Generate embedding for the search query
    const searchEmbedding = await generateEmbedding(searchQuery);

    // Step 2: Fetch recipes (user's if authenticated, otherwise all/trending)
    let query = supabase.from("saved_recipes").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    // If no userId, return all recipes (trending/seeded ones)

    const { data: recipes, error: fetchError } = await query;

    if (fetchError) {
      console.error("❌ Supabase fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch recipes", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json(
        {
          found: false,
          matches: [],
          message: "No recipes found",
        },
        { status: 200 }
      );
    }

    // Step 3: Score each recipe by similarity
    const scored = recipes
      .map((recipe) => {
        if (!recipe.embedding) {
          console.warn(`⚠️ Recipe ${recipe.id} has no embedding`);
          return { recipe, similarity: 0 };
        }

        const similarity = cosineSimilarity(searchEmbedding, recipe.embedding);
        return { recipe, similarity };
      })
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    console.log(
      `✅ Found ${scored.length} matches (threshold: ${threshold})`
    );

    // Step 4: Return matches
    return NextResponse.json(
      {
        found: scored.length > 0,
        matches: scored.map((item) => ({
          ...item.recipe,
          similarity: Math.round(item.similarity * 100), // percentage
        })),
        bestMatch: scored.length > 0 ? scored[0].recipe : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ /api/search-recipes error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}