// app/api/parse-recipe/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean);

let keyIndex = 0;
const nextKey = () => (API_KEYS.length ? API_KEYS[keyIndex++ % API_KEYS.length] : null);

const SYSTEM_RULES = String.raw`You are SABOR recipe parser. Extract recipe data from HTML and return ONLY valid JSON.
No markdown, no code fences, no comments.

OUTPUT CONTRACT (non-negotiable):
Return ONLY a JSON object with these fields:
- title (string)
- description (string) — one sentence
- servings (integer 1–64)
- calories (integer, per serving, estimate if not found)
- prep (integer minutes, estimate if not found)
- cook (integer minutes, estimate if not found)
- servingSize (short phrase, e.g., "1 bowl (350 g)")
- ingredients (array of strings)
- instructions (array of strings)
- toolsNeeded (array of strings, optional)
- nutrition (object with keys: protein, carbs, fat, fiber, sodium, sugar - use "0g" or "0mg" format)
- sources (array of 1 object with: name (site name), url (the source URL), type ("Website"), learned (what you extracted))

CRITICAL:
- Extract EXACTLY what's on the page, don't invent
- If nutrition data missing, use reasonable estimates based on ingredients
- Keep ingredients as-is from the recipe
- Format times as integers (minutes only)
- Return ONLY JSON, nothing else
- sources should be an array with exactly 1 object`;

async function fetchRecipeHTML(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      throw new Error("Page content too small or empty");
    }

    return html.slice(0, 100000); // Limit to first 100KB
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - URL took too long to respond");
    }
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

function cleanHTML(html) {
  // Remove scripts, styles, and excessive whitespace
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    console.log("📍 Parsing recipe from:", url);

    // Fetch the recipe HTML
    const html = await fetchRecipeHTML(url);
    const cleanedHTML = cleanHTML(html);

    if (!cleanedHTML || cleanedHTML.length < 100) {
      return NextResponse.json(
        { error: "Could not extract content from URL" },
        { status: 400 }
      );
    }

    // Use Gemini to parse the recipe
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const key = nextKey();
      if (!key) {
        return NextResponse.json(
          { error: "No API keys available" },
          { status: 503 }
        );
      }

      try {
        const client = new GoogleGenerativeAI(key);
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

        const response = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Extract recipe data from this HTML content and return ONLY a JSON object:\n\n${cleanedHTML}`,
                },
              ],
            },
          ],
          systemInstruction: SYSTEM_RULES,
        });

        // Handle Gemini response
        if (!response || !response.response) {
          throw new Error("No response from Gemini API");
        }

        const text = response.response.text();

        if (!text || text.length < 10) {
          throw new Error("Empty response from Gemini");
        }

        console.log("Gemini response preview:", text.slice(0, 200));

        // Parse JSON response - find JSON in response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Could not find JSON in response:", text.slice(0, 500));
          throw new Error("Gemini did not return valid JSON. Response: " + text.slice(0, 200));
        }

        let data;
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.error("Failed to parse JSON:", parseErr);
          throw new Error("Invalid JSON from Gemini: " + parseErr.message);
        }

        // Normalize data
        const toInt = (v) =>
          Number.isFinite(v) ? v : parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0;
        const arr = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
        const str = (v, f) => (typeof v === "string" && v.trim() ? v.trim() : f);

        data.title = str(data.title, "Recipe");
        data.description = str(data.description, "A delicious recipe from the web");
        data.servings = Math.max(1, toInt(data.servings || 1));
        data.calories = toInt(data.calories || 0);
        data.prep = toInt(data.prep || 15);
        data.cook = toInt(data.cook || 30);
        data.totalTime = Math.max(data.prep + data.cook, toInt(data.totalTime || 0));
        data.servingSize = str(data.servingSize, "1 serving");
        data.ingredients = arr(data.ingredients);
        data.instructions = arr(data.instructions);
        data.toolsNeeded = arr(data.toolsNeeded);

        // Ensure nutrition object
        if (!data.nutrition || typeof data.nutrition !== "object") {
          data.nutrition = {};
        }
        const nutritionDefaults = {
          protein: "0g",
          carbs: "0g",
          fat: "0g",
          fiber: "0g",
          sodium: "0mg",
          sugar: "0g",
        };
        data.nutrition = {
          ...nutritionDefaults,
          ...data.nutrition,
        };

        // Ensure sources
        if (!Array.isArray(data.sources)) {
          data.sources = [];
        }
        if (data.sources.length === 0) {
          data.sources.push({
            name: new URL(url).hostname,
            url: url,
            type: "Website",
            learned: "Extracted recipe from website",
          });
        } else {
          // Ensure first source has the URL we fetched from
          data.sources[0] = {
            name: data.sources[0]?.name || new URL(url).hostname,
            url: url,
            type: "Website",
            learned: data.sources[0]?.learned || "Extracted recipe from website",
          };
        }

        // Time display strings
        const fmtTime = (mins) => {
          if (!Number.isFinite(mins)) mins = 0;
          if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const rem = mins % 60;
            return rem
              ? `${hrs} hr${hrs > 1 ? "s" : ""} ${rem} min${rem !== 1 ? "s" : ""}`
              : `${hrs} hr${hrs > 1 ? "s" : ""}`;
          }
          return `${mins} min${mins !== 1 ? "s" : ""}`;
        };
        data.prepTimeDisplay = fmtTime(data.prep);
        data.cookTimeDisplay = fmtTime(data.cook);
        data.totalTimeDisplay = fmtTime(data.totalTime);

        console.log("✅ Recipe parsed successfully:", data.title);
        return NextResponse.json(data, { status: 200 });
      } catch (error) {
        const msg = error?.message || String(error);
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, msg);

        if (
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("rate")
        ) {
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((r) => setTimeout(r, BASE_DELAY_MS));
            continue;
          }
        }
        throw error;
      }
    }

    return NextResponse.json(
      { error: "Failed to parse recipe after multiple attempts" },
      { status: 500 }
    );
  } catch (error) {
    console.error("❌ /api/parse-recipe error:", error?.message || error);
    return NextResponse.json(
      {
        error: "Failed to parse recipe",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}