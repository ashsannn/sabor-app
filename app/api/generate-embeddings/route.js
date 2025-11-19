// app/api/generate-embeddings/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate embedding for text
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

// Create searchable text from recipe
function createSearchableText(recipe) {
  const parts = [
    recipe.title,
    recipe.description || "",
    ...(recipe.ingredients || []),
  ];
  return parts.filter(Boolean).join(" ");
}

// GET - Check status
export async function GET(req) {
  try {
    // Check how many recipes need embeddings
    const { count: totalCount } = await supabase
      .from("saved_recipes")
      .select("*", { count: "exact", head: true });

    const { count: missingCount } = await supabase
      .from("saved_recipes")
      .select("*", { count: "exact", head: true })
      .is("embedding", null);

    return NextResponse.json({
      ok: true,
      total: totalCount || 0,
      needsEmbedding: missingCount || 0,
      hasEmbedding: (totalCount || 0) - (missingCount || 0),
    });
  } catch (err) {
    console.error("❌ Status check error:", err);
    return NextResponse.json(
      { error: "Failed to check status", message: err.message },
      { status: 500 }
    );
  }
}

// POST - Generate embeddings
export async function POST(req) {
  try {
    const body = await req.json();
    const { adminKey, limit = 50 } = body;

    // 🔒 SECURITY: Simple admin key check
    // Replace this with your actual auth check!
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🚀 Starting embedding generation...");

    // Fetch recipes without embeddings (with limit to avoid timeout)
    const { data: recipes, error: fetchError } = await supabase
      .from("saved_recipes")
      .select("*")
      .is("embedding", null)
      .limit(limit);

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch recipes", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "All recipes already have embeddings!",
        processed: 0,
        errors: 0,
      });
    }

    console.log(`📊 Processing ${recipes.length} recipes`);

    // Process each recipe
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const recipe of recipes) {
      try {
        console.log(`Processing: ${recipe.title}`);

        // Create searchable text
        const searchableText = createSearchableText(recipe);

        // Generate embedding
        const embedding = await generateEmbedding(searchableText);

        // Update in database
        const { error: updateError } = await supabase
          .from("saved_recipes")
          .update({ embedding })
          .eq("id", recipe.id);

        if (updateError) {
          console.error(`❌ Update failed for ${recipe.id}:`, updateError);
          errorCount++;
          results.push({
            id: recipe.id,
            title: recipe.title,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`✅ Updated: ${recipe.title}`);
          successCount++;
          results.push({
            id: recipe.id,
            title: recipe.title,
            success: true,
          });
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`❌ Error processing ${recipe.id}:`, err);
        errorCount++;
        results.push({
          id: recipe.id,
          title: recipe.title,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: successCount + errorCount,
      success: successCount,
      errors: errorCount,
      results,
    });
  } catch (err) {
    console.error("❌ /api/generate-embeddings error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}