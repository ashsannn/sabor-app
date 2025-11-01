// app/api/generate-recipe/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 25;

/* --------------------------- ENV / KEY ROTATION --------------------------- */
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

/* ------------------------------ MODEL ORDER ------------------------------ */
const MODEL_CANDIDATES_BASE = ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp"];

function buildModelList() {
  const pinned = (process.env.GEMINI_MODEL || "").trim();
  if (!pinned) return MODEL_CANDIDATES_BASE;
  return [pinned, ...MODEL_CANDIDATES_BASE.filter((m) => m !== pinned)];
}

/* ------------------------------- UI RULES -------------------------------- */
const SYSTEM_RULES = String.raw`You are SABOR. Output ONLY JSON. No markdown, no comments, no code fences.
All times are minutes (integers). "calories" is per serving (integer). Never omit required fields.

CRITICAL SAFETY RULES — MUST FOLLOW
- NEVER include poisonous/toxic ingredients (e.g., raw kidney beans, raw elderberries, bitter almonds, cassava without proper processing).
- Avoid raw/undercooked foods that pose risk: raw chicken/pork, raw ground meat, raw eggs for vulnerable populations; cook to safe temps (chicken 165°F/74°C, ground meats 160°F/71°C, fish 145°F/63°C unless validated sushi-grade).
- Do NOT propose combinations known to be unsafe together.
- If user asks for unsafe practices, decline and provide a safe alternative.
- For fermentation/pickling/canning, only suggest widely accepted home-safe methods with correct salt/pH/time guidance.

ALLERGEN & DIETARY LABELING
- When an ingredient falls under common allergens (nuts, shellfish, dairy, eggs, soy, wheat/gluten, fish, sesame), include the term in the ingredient line or indicate "(contains X)" where obvious.
- Respect explicit user dietary constraints if given (vegetarian, vegan, halal, kosher, gluten-free, low-sodium, etc.) by choosing compliant ingredients and techniques.

INGREDIENT/SECTION FORMATTING (for UI parsing)
- Use section headers for multi-part recipes as plain strings wrapped in **, e.g. "**For the Sauce:**".
- Do NOT emit bullets/dashes/HTML; only plain text lines.
- Use clear units; keep units consistent within the recipe.

INSTRUCTION STYLE
- Each array item is a concise step sentence (no numeric prefixes), with doneness cues (e.g., "until lightly browned", "simmer 6–8 min").

CULTURAL SOURCING — HIGH PRIORITY
- Cite 3–5 real, culturally authentic sources and what they informed (technique/ratio/history). Use canonical URLs when possible.

OUTPUT CONTRACT (non-negotiable)
Return ONLY a JSON object with these fields:
- title (string)
- description (string) — one sentence capturing the essence of the recipe
- servings (integer 1–64)
- calories (integer, per serving)
- prep (integer minutes)
- cook (integer minutes)
- totalTime (integer minutes)
- servingSize (short phrase, e.g., "1 bowl (350 g)")
- ingredients (array of strings; allow section headers like "**For the Sauce:**")
- instructions (array of strings)
- toolsNeeded (array of strings; optional)
- sources (array of 3–5 strings; real URLs or "Author — URL")
Never output anything outside of that JSON object.`;


/* ------------------------------ HEALTH / CORS ----------------------------- */
export async function GET(req) {
  const url = new URL(req.url);
  const diagnose = url.searchParams.get("diagnose") === "1";
  const models = buildModelList();
  if (!diagnose) {
    return NextResponse.json(
      { ok: true, route: "/api/generate-recipe", method: "GET", keys: API_KEYS.length, models },
      { status: 200 }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      env: {
        keysPresent: API_KEYS.length,
        hasPinnedModelEnv: Boolean((process.env.GEMINI_MODEL || "").trim()),
      },
      modelOrder: models,
    },
    { status: 200 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/* --------------------------------- CORE ---------------------------------- */
// Legacy quick gate (kept as extra net)
const FORBIDDEN = [/illegal/i, /self\s*harm/i, /hate\s*speech/i, /adult\s*content/i];

const REQUIRED_FIELDS = [
  "title",
  "description",
  "servings",
  "calories",
  "prep",
  "cook",
  "totalTime",
  "servingSize",
  "ingredients",
  "instructions",
  "sources",
];

/* ----------------------- EXPANDED SAFETY FILTERS ------------------------- */
// Profanity
const BAD_WORDS = ["fuck","fucking","shit","bitch","asshole","bastard","cunt","dick","slut","whore"];

// Sexual/explicit
const SEXUAL_TERMS = [
  "sex","sexual","porn","porno","pornographic","nude","naked","nudes",
  "boobs","tits","pussy","vagina","dick","penis","cock","balls","testicles",
  "cum","ejaculate","orgasm","anal","oral sex","blowjob","handjob","masturbate",
  "threesome","hookup","fetish","bdsm","dominatrix","erotic","explicit","nsfw"
];

// Hate/demeaning
const HATEFUL_PHRASES = [
  "ugly people","fat people","skinny people","stupid people","retarded","disabled people","crippled",
  "mentally ill people","autistic people","black people","white people","asian people","jewish people",
  "muslim people","gay people","trans people","lesbian people","fag","dyke","tranny","nazi","kkk"
];
function containsHateSpeech(text) {
  const s = text.toLowerCase();
  const foodAdjPattern = /\b(gay|trans|lesbian|queer|black|white|asian|muslim|jewish)\s+(snack|snacks|food|meal|dish|cuisine|recipe)\b/i;
  if (foodAdjPattern.test(s)) return true;
  return HATEFUL_PHRASES.some(p => s.includes(p));
}

// ED medicalization
const ED_TERMS = [
  "anorexia","anorexic","anorexia nervosa",
  "bulimia","bulimic","binge eating","binge-eating","bed",
  "arfid","avoidant restrictive","ed recovery","eating disorder","eating-disorder","purge","purging","pro-ana","pro mia"
];
const MEDICALIZE = /\b(for|to\s+(treat|cure|help|manage|recover)|help(?:ing)?\s+with|recovery\s+from)\b/i;

// Hazmat/poisons
const HAZMAT_TERMS = [
  "poison","rat poison","rodenticide","pesticide","insecticide","herbicide",
  "bleach","lye","drain cleaner","detergent","ammonia","antifreeze",
  "gasoline","paint thinner","fertilizer","cyanide","arsenic","mercury","lead"
];

// Bio waste
const BIO_WASTE_TERMS = ["poop","feces","faeces","urine","pee","vomit","vomitus","diarrhea","diarrhoea","blood","semen"];

// Violence & self-harm
const VIOLENCE_TERMS = [
  "kill","injure","harm","assault","attack","beat up","stab","shoot","explode","explosive","bomb","molotov",
  "napalm","thermite","gunpowder","flash powder","tannerite","chlorate","peroxide bomb","ammonium nitrate"
];
const SELF_HARM_TERMS = ["suicide","self harm","self-harm","kill myself","hurt myself","poison myself","overdose","od","cut myself"];

// Extremism
const EXTREMISM_TERMS = ["isis","al-qaeda","nazis","neo-nazi","kkk","white supremacist","jihadi","extremist manifesto"];

// Drugs & illicit alcohol
const DRUGS_ILLEGAL = ["cocaine","heroin","meth","methamphetamine","mdma","lsd","dmt","gbl","ghb","fentanyl","ketamine","psilocybin"];
const DRUGS_HOME_BREW = ["moonshine","still","distill spirits","illicit alcohol","home distillation"];

// Drug slurs / intoxication slang
const DRUG_SLURS = ["crackhead","crack head","meth head","tweaker","junkie","addict","drug addict","cokehead","stoner","druggie"];
const INTOXICATION_SLANG = [
  "coked out","high af","high as fuck","stoned","tripping","trippin","wasted",
  "blackout","blacked out","hammered","plastered","buzzed","drunk af","drunk as hell"
];

// Real person / celebrity
const CELEBRITY_TERMS = [
  "amber heard","elon musk","donald trump","joe biden","barack obama","hillary clinton","taylor swift",
  "beyonce","rihanna","drake","justin bieber","kanye","kim kardashian","kylie jenner","timothee chalamet",
  "zendaya","lady gaga","bill gates","mark zuckerberg","jeff bezos","putin","xi jinping","trump","obama","biden","hitler","pope francis","pope"
];
const NAME_PATTERN = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/;

// Infant/child safety
const CHILD_SAFETY_TERMS = ["child","kid","toddler","baby","infant","newborn"];
const INFANT_UNSAFE_FOODS = ["honey","raw milk","unpasteurized milk","alcohol","spirits","wine","beer"];

// Explicit unsafe raw
const RAW_UNSAFE_REQUESTS = [
  "raw chicken","raw pork","raw ground beef","undercooked chicken","undercooked pork","pink chicken",
  "raw kidney beans","bitter almonds","raw elderberries","improper cassava"
];

// Medical claims
const MEDICAL_DISEASE_TERMS = [
  "cancer","diabetes","covid","hypertension","heart disease","alzheim","parkinson","depression","anxiety",
  "adhd","autism","arthritis","stroke","seizure","epilepsy","pcos","endometriosis"
];
const MEDICAL_CLAIMS = /\b(cure|treat|reverse|heal|prevent|therapy|therapeutic|dosage|dose|prescribe|prescription)\b/i;

// Diet-culture / moralized food
const DIET_CULTURE_TERMS = [
  "cheat meal","cheater food","cheat food","cheater snack","cheat day","cheating food",
  "sinful","guilty pleasure","guilt free","guilt-free","bad food","forbidden food",
  "weight loss","fat burning","fat-burning","detox","cleanse","clean eating","burn fat",
  "low calorie diet","starvation","restrictive diet"
];
function containsDietCulture(s) {
  const lower = s.toLowerCase();
  const pattern = /\b(cheat|cheater|guilt|sinful|forbidden)\s+(meal|snack|food|dish|dessert)\b/i;
  if (pattern.test(lower)) return true;
  return DIET_CULTURE_TERMS.some(t => lower.includes(t));
}

/* ---------------------- FOOD INTENT (ALLOW-LIST) ------------------------- */
// Verbs, dishes, units, kitchens (EN/ES), cuisines, meal context, ingredient-only
const COOKING_VERBS = ["cook","bake","roast","grill","sauté","saute","sear","stir-fry","fry","steam","poach","simmer","broil","braise","blanch","knead","marinate","pickle","cure","ferment","whisk","chop","dice","mince","mix","stir","preheat","mise"];
const DISH_WORDS = ["recipe","dish","soup","stew","salad","curry","tacos","tortillas","enchiladas","bowl","sandwich","pasta","noodles","ramen","bibimbap","salsa","sauce","dressing","bread","cake","cookie","brownie","muffin","pancake","waffle","omelet","omelette","casserole","risotto","paella","pozole","tamales","ceviche","guacamole","stir fry","stir-fry"];
const FOOD_UNITS = ["cup","cups","tbsp","tsp","teaspoon","tablespoon","gram","grams","g","kg","ml","l","liter","litre","ounce","oz","pound","lb","clove","pinch","dash"];
const INGREDIENT_HINTS = ["ingredients","ingredient","servings","prep","cook time","preheat","oven","skillet","saucepan"];
const CUISINES = ["mexican","korean","indian","japanese","chinese","thai","vietnamese","italian","french","spanish","lebanese","persian","greek","turkish","ethiopian","american","peruvian","brazilian"];
const DIET_NEUTRAL = ["low sodium","low-sodium","low salt","high protein","high-protein","low sugar","no sugar added","gluten-free","dairy-free","vegan","vegetarian","halal","kosher"];
const MEAL_CONTEXT = ["dinner","lunch","breakfast","brunch","supper","snack","meal","for two","for 2","date night","cozy","comfort food","rainy day","cold day","weeknight","quick dinner","easy dinner"];
const COMMON_INGREDIENTS = ["rice","egg","eggs","chicken","beef","pork","tofu","tomato","onion","garlic","pasta","beans","lentils","cheese","potato","potatoes","bread","milk","flour","butter","oil","spinach","broccoli","mushroom","arroz","huevo","huevos","pollo","res","carne","cerdo","tofu","tomate","cebolla","ajo","pasta","frijoles","lentejas","queso","papa","papas","pan","leche","harina","mantequilla","aceite","espinaca","brócoli","champiñón"];
const COOKING_VERBS_ES = ["cocinar","hornear","asar","guisar","freír","saltear","hervir","cocer","marinar","fermentar","mezclar","batir","picar","precalentar"];
const DISH_WORDS_ES = ["receta","sopa","estofado","ensalada","curry","tacos","tortillas","enchiladas","salsa","pan","pastel","galleta","tamales","pozole","ceviche","guacamole"];
const FOOD_UNITS_ES = ["taza","tazas","cda","cdta","cucharada","cucharadita","gramo","gramos","kg","ml","litro","onza","lb","diente","pizca"];

function hasAny(s, list) { return list.some(w => s.includes(w)); }
function containsAnyTerms(s, terms) {
  const hay = ` ${s.toLowerCase()} `;
  return terms.some(t => hay.includes(` ${t.toLowerCase()} `));
}
function containsSexualContent(s) {
  const pattern = /\b(sex|sexual|pussy|dick|cock|boob|penis|vagina|porn|nude|nsfw)\b/i;
  if (pattern.test(s)) return true;
  return SEXUAL_TERMS.some(t => s.includes(t));
}
function containsDrugSlurOrIntoxication(s) {
  return DRUG_SLURS.some(t => s.includes(t)) || INTOXICATION_SLANG.some(t => s.includes(t));
}
function containsRealPersonReference(s) {
  const lower = s.toLowerCase();
  if (CELEBRITY_TERMS.some(n => lower.includes(n))) return true;
  return NAME_PATTERN.test(s); // heuristic: two capitalized words
}

// Ingredient-only heuristic: allow if 2+ common ingredients OR one ingredient with a joiner ("," / "and" / "y")
function isIngredientOnly(s) {
  const hits = COMMON_INGREDIENTS.filter(w => s.includes(` ${w} `));
  if (hits.length >= 2) return true;
  if (hits.length === 1 && /[,/&]|(\sand\s)|(\sy\s)/i.test(s)) return true;
  return false;
}

function isFoodIntent(text) {
  const s = ` ${text.toLowerCase()} `;
  if (hasAny(s, DISH_WORDS) || hasAny(s, DISH_WORDS_ES)) return true;
  if (hasAny(s, COOKING_VERBS) || hasAny(s, COOKING_VERBS_ES)) return true;

  const unitHit = hasAny(s, FOOD_UNITS) || hasAny(s, FOOD_UNITS_ES);
  const ingredientContext = hasAny(s, INGREDIENT_HINTS);
  if (unitHit && ingredientContext) return true;

  if (hasAny(s, CUISINES) && hasAny(s, [" food "," cuisine "," dish "," receta "," comida "," recipe "])) return true;

  if (hasAny(s, DIET_NEUTRAL) && (hasAny(s, DISH_WORDS) || hasAny(s, COOKING_VERBS))) return true;

  if (hasAny(s, MEAL_CONTEXT)) return true;

  if (isIngredientOnly(s)) return true;

  return false;
}

/* ---------------------- VALIDATION (HYBRID ORDER) ------------------------ */
const REASON_MESSAGE = {
  empty: "Describe a real dish or ingredients.",
  too_short: "Add a bit more detail to your request.",
  url_code: "No links, code, or SQL please.",
  profanity: "Let’s keep things respectful.",
  sexual_explicit: "We can’t generate recipes or content with sexual or explicit themes.",
  demeaning_hate: "We can’t generate demeaning or hateful content toward any group.",
  ed_medicalized: "We can’t generate medicalized recipes for eating-disorder contexts.",
  hazmat: "We can’t generate recipes involving poisons or hazardous substances.",
  bio_waste: "We can’t generate recipes involving biological waste or bodily fluids.",
  illegal_drugs: "We can’t help with illegal drugs.",
  illicit_alcohol: "We can’t help with illicit alcohol/distillation.",
  extremism: "We can’t generate content related to extremist ideologies.",
  allergy_sabotage: "We can’t assist with actions that endanger people with allergies.",
  violence: "We can’t assist with violent or harmful intent.",
  self_harm: "We can’t assist with self-harm content.",
  infant_unsafe: "That’s unsafe for infants. Ask for an age-appropriate recipe.",
  unsafe_raw: "That request involves unsafe raw/undercooked food handling.",
  medical_claims: "We can’t make medical claims or therapies; try a general recipe request.",
  diet_culture: "We avoid framing foods as 'cheat' or 'guilt-free.' Try describing the dish itself instead.",
  drug_slur: "We can’t generate content using slurs or slang around drug use or intoxication.",
  real_person: "We can’t generate recipes or content referencing real people.",
  not_food_intent: "Please ask for a real dish, ingredients, or cooking help."
};

function validatePrompt(text) {
  if (!text) return { invalid: true, reason: "empty" };
  const s = String(text).trim();
  const sl = s.toLowerCase();

  if (sl.length < 3) return { invalid: true, reason: "too_short" };
  if (/(https?:\/\/|www\.|@\w+|```|{[^}]*}|\bselect\b.*\bfrom\b)/i.test(sl)) return { invalid: true, reason: "url_code" };

  // HARD BLOCKS FIRST
  if (new RegExp(`\\b(${BAD_WORDS.join("|")})\\b`, "i").test(sl)) return { invalid: true, reason: "profanity" };
  if (containsSexualContent(sl)) return { invalid: true, reason: "sexual_explicit" };
  if (containsHateSpeech(sl)) return { invalid: true, reason: "demeaning_hate" };
  if (MEDICALIZE.test(sl) && ED_TERMS.some(t => sl.includes(t))) return { invalid: true, reason: "ed_medicalized" };
  if (containsAnyTerms(sl, HAZMAT_TERMS)) return { invalid: true, reason: "hazmat" };
  if (containsAnyTerms(sl, BIO_WASTE_TERMS)) return { invalid: true, reason: "bio_waste" };
  if (containsAnyTerms(sl, DRUGS_ILLEGAL)) return { invalid: true, reason: "illegal_drugs" };
  if (containsAnyTerms(sl, DRUGS_HOME_BREW)) return { invalid: true, reason: "illicit_alcohol" };
  if (containsAnyTerms(sl, EXTREMISM_TERMS)) return { invalid: true, reason: "extremism" };

  const ALLERGY_SABOTAGE = /\b(give|hide|sneak)\s+(peanuts?|nut|shellfish|gluten|sesame|dairy)\s+(to|for)\s+(someone|them|friend|family)\b/i;
  if (ALLERGY_SABOTAGE.test(sl)) return { invalid: true, reason: "allergy_sabotage" };

  if (containsAnyTerms(sl, VIOLENCE_TERMS)) return { invalid: true, reason: "violence" };
  if (containsAnyTerms(sl, SELF_HARM_TERMS)) return { invalid: true, reason: "self_harm" };
  if (containsRealPersonReference(s)) return { invalid: true, reason: "real_person" };
  if (containsAnyTerms(sl, CHILD_SAFETY_TERMS) && containsAnyTerms(sl, INFANT_UNSAFE_FOODS)) return { invalid: true, reason: "infant_unsafe" };
  if (containsAnyTerms(sl, RAW_UNSAFE_REQUESTS)) return { invalid: true, reason: "unsafe_raw" };
  if (MEDICAL_CLAIMS.test(sl) && containsAnyTerms(sl, MEDICAL_DISEASE_TERMS)) return { invalid: true, reason: "medical_claims" };
  if (containsDietCulture(sl)) return { invalid: true, reason: "diet_culture" };
  if (containsDrugSlurOrIntoxication(sl)) return { invalid: true, reason: "drug_slur" };

  // THEN: POSITIVE FOOD INTENT
  if (!isFoodIntent(s)) return { invalid: true, reason: "not_food_intent" };

  return { invalid: false };
}

function is429(msg = "") {
  const s = msg.toLowerCase();
  return s.includes("429") || s.includes("too many requests") || s.includes("quota");
}

/* -------------------- GEMINI CALL (single attempt helper) ----------------- */
async function generateOnce(key, model, text) {
  const genAI = new GoogleGenerativeAI(key);
  const m = genAI.getGenerativeModel({ model });
  const r = await m.generateContent({
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: { temperature: 0.7, topP: 0.95, topK: 40 },
  });
  return r?.response?.text?.() ?? "";
}

/* ------------------------------- POST MAIN ------------------------------ */
export async function POST(req) {
  const TRY_TRACE = [];
  try {
    const { prompt } = await req.json();

    const inv = !prompt?.trim() ? { invalid: true, reason: "empty" } : validatePrompt(prompt);
    if (inv.invalid) {
      return NextResponse.json(
        { error: "INVALID_INPUT", reason: inv.reason, message: REASON_MESSAGE[inv.reason] || "Request not allowed." },
        { status: 422 }
      );
    }

    // Extra legacy net
    if (FORBIDDEN.some((r) => r.test(prompt))) {
      return NextResponse.json(
        { error: "INVALID_INPUT", reason: "legacy_forbidden", message: "Invalid or unsafe prompt." },
        { status: 422 }
      );
    }

    if (!API_KEYS.length) {
      return NextResponse.json({ error: "SERVER_ERROR", message: "No API key configured." }, { status: 500 });
    }

    const modelOrder = buildModelList();
    const bigPrompt = `${SYSTEM_RULES}\n\nGenerate a culturally authentic recipe for: ${prompt}\nReturn ONLY the JSON object described.`;

    const MAX_RETRIES_PER_COMBO = 2;
    const BASE_DELAY_MS = 900;

    for (let kTry = 0; kTry < API_KEYS.length; kTry++) {
      const key = nextKey();

      for (const model of modelOrder) {
        for (let attempt = 0; attempt <= MAX_RETRIES_PER_COMBO; attempt++) {
          TRY_TRACE.push({ keyIndex: kTry, model, attempt: attempt + 1 });
          console.log(`🔁 SABOR try: key#${kTry + 1}/${API_KEYS.length}, model=${model}, attempt=${attempt + 1}`);

          try {
            const out = await generateOnce(key, model, bigPrompt);

            // Parse JSON (with fallback extraction)
            let data = null;
            try {
              data = JSON.parse(out);
            } catch {
              const m = out.match(/\{[\s\S]*\}/);
              if (m) {
                try { data = JSON.parse(m[0]); } catch {}
              }
            }

            if (!data || typeof data !== "object") {
              return NextResponse.json(
                { error: "BAD_OUTPUT", message: "Model did not return JSON.", snippet: String(out).slice(0, 400) },
                { status: 502 }
              );
            }

            // Normalize for UI
            const toInt = (v) => (Number.isFinite(v) ? v : parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0);
            const arr = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
            const str = (v, f) => (typeof v === "string" && v.trim() ? v.trim() : f);

            data.title = str(data.title, "Untitled Recipe");
            data.description = str(data.description, "A delicious recipe");
            data.servings = toInt(data.servings || 1);
            data.calories = toInt(data.calories || data?.nutrition?.caloriesPerServing || 0);
            data.prep = toInt(data.prep || 0);
            data.cook = toInt(data.cook || 0);
            data.totalTime = Math.max(toInt(data.totalTime || 0), data.prep + data.cook);
            data.servingSize = str(data.servingSize, "1 serving");
            data.ingredients = arr(data.ingredients);
            data.instructions = arr(data.instructions);
            data.toolsNeeded = arr(data.toolsNeeded);
            data.sources = arr(data.sources);
            while (data.sources.length < 3) data.sources.push("Source — https://example.com");

            // Human-friendly time strings with units
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

            // Final presence gate
            for (const k of REQUIRED_FIELDS) {
              if (!(k in data)) {
                if (["ingredients", "instructions", "sources"].includes(k)) data[k] = [];
                else if (["servings", "calories", "prep", "cook", "totalTime"].includes(k)) data[k] = 0;
                else data[k] = "";
              }
            }

            return NextResponse.json(data, { status: 200 });
          } catch (err) {
            const msg = err?.message || String(err);
            if (is429(msg) && attempt < MAX_RETRIES_PER_COMBO) {
              const delay = BASE_DELAY_MS * Math.pow(2, attempt);
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            // otherwise fall through to next model / key
          }
        }
      }
    }

    // Exhausted keys/models
    return NextResponse.json(
      {
        error: "QUOTA_EXCEEDED",
        message:
          "All keys/models are exhausted or rate-limited. Add another project key, enable billing, or try again later.",
        tried: TRY_TRACE,
      },
      { status: 429 }
    );
  } catch (err) {
    console.error("❌ /api/generate-recipe error:", err?.message || err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err?.message || "Unknown error", tried: TRY_TRACE },
      { status: 500 }
    );
  }
}