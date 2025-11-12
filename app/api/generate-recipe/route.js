// app/api/generate-recipe/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

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
const MODEL_CANDIDATES_BASE = ["gemini-2.5-flash"];  // ⚡ CHANGED: single stable model
function buildModelList() {
  const pinned = (process.env.GEMINI_MODEL || "").trim();
  if (!pinned) return MODEL_CANDIDATES_BASE;
  return [pinned, ...MODEL_CANDIDATES_BASE.filter((m) => m !== pinned)];
}

/* ------------------------------- SYSTEM RULES ---------------------------- */
const SYSTEM_RULES = String.raw`You are SABOR. Output ONLY JSON. No markdown, no comments, no code fences.
All times are minutes (integers). "calories" is per serving (integer). Never omit required fields.

NUTRITION CALCULATION - CRITICAL
- Calculate calories and nutrition facts PER SERVING using standard USDA/nutrition databases.
- For each ingredient, multiply (ingredient amount in grams) × (nutrient density) / (servings).
- Example: 100g chicken breast ~165 cal, so 6oz (170g) = ~280 cal per serving if serves 4.
- nutrition object MUST include: protein (g), carbs (g), fat (g), fiber (g), sodium (mg), sugar (g).
- Be as accurate as possible using real ingredient nutritional values.
- Round to whole numbers for calories; use 1 decimal for macros (e.g., "25.5g protein").

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

SOURCING — HIGH PRIORITY
- Cite 4 real, reliable sources. If the recipe is cultural/ethnic, sources MUST be culturally authentic. Otherwise, cite any reliable cooking source.
- Each source MUST have: name (string), url (string with full https://), type (string), learned (string describing what you learned)
- Example source object: { "name": "Just One Cookbook", "url": "https://www.justonecookbook.com/", "type": "Food Blog", "learned": "got authentic Japanese folding technique" }
- ALWAYS return sources as JSON objects, NEVER as plain strings

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
- nutrition (object with EXACTLY these keys: { "protein": "25g", "carbs": "45g", "fat": "12g", "fiber": "8g", "sodium": "650mg", "sugar": "5g" })
- sources (REQUIRED: array of EXACTLY 4 objects. EACH object MUST have ALL 4 fields: name (string), url (string starting with https://), type (string), learned (string). Example: [{"name": "Just One Cookbook", "url": "https://www.justonecookbook.com", "type": "Food Blog", "learned": "got authentic Japanese technique"}, ...])

CRITICAL: Return sources ONLY as JSON objects with all 4 fields. NEVER return sources as strings.
Never output anything outside of that JSON object.`;

/* ---------------------- CULTURAL SOURCE REGISTRY (deduped) --------------- */
const SOURCE_REGISTRY = [
  // --- United States / American
  { domain: "southernliving.com", cuisines: ["American", "Southern"] },
  { domain: "bonappetit.com", cuisines: ["American", "Modern American"] },
  { domain: "foodandwine.com", cuisines: ["American", "Contemporary"] },
  { domain: "delish.com", cuisines: ["American", "Everyday"] },
  { domain: "thepioneerwoman.com", cuisines: ["American", "Midwestern"] },
  { domain: "tasteofhome.com", cuisines: ["American", "Regional"] },
  { domain: "allrecipes.com", cuisines: ["American", "General"] },
  { domain: "americastestkitchen.com", cuisines: ["American", "Tested"] },
  { domain: "cooksillustrated.com", cuisines: ["American", "Tested"] },
  { domain: "epicurious.com", cuisines: ["American", "General"] },

  // --- Baking & sweets
  { domain: "sallysbakingaddiction.com", cuisines: ["American", "Baking"] },
  { domain: "kingarthurbaking.com", cuisines: ["American", "Baking"] },
  { domain: "joythebaker.com", cuisines: ["American", "Southern"] },

  // --- Barbecue & regional
  { domain: "amazingribs.com", cuisines: ["American", "BBQ"] },
  { domain: "heygrillhey.com", cuisines: ["American", "BBQ"] },
  { domain: "texasmonthly.com", cuisines: ["American", "Texan", "BBQ"] },

  // --- Soul Food & Southern diaspora
  { domain: "divascancook.com", cuisines: ["American", "Soul Food", "Southern"] },
  { domain: "soulfoodandsoutherncooking.com", cuisines: ["American", "Soul Food"] },
  { domain: "sweetpotatosoul.com", cuisines: ["American", "Soul Food", "Vegan"] },

  // --- Native & heritage-inspired
  { domain: "firstnations.org", cuisines: ["American", "Indigenous"] },
  { domain: "sioux-chef.com", cuisines: ["American", "Indigenous"] },

  // --- General but U.S.-centered
  { domain: "seriouseats.com", cuisines: ["American", "General"] },
  { domain: "cooking.nytimes.com", cuisines: ["American", "General"] },
  { domain: "foodnetwork.com", cuisines: ["American", "General"] },
  { domain: "bettycrocker.com", cuisines: ["American", "Classic"] },
  
  // --- Mexico / LatAm
  { domain: "laroussecocina.mx", cuisines: ["Mexican"] },
  { domain: "cocinamexicana.gob.mx", cuisines: ["Mexican"] },
  { domain: "gourmetdemexico.com.mx", cuisines: ["Mexican"] },
  { domain: "kiwilimon.com", cuisines: ["Mexican","General LatAm"] },
  { domain: "mexicoinmykitchen.com", cuisines: ["Mexican"] },
  { domain: "patijinich.com", cuisines: ["Mexican"] },
  { domain: "lacocinademipily.com", cuisines: ["Mexican"] },

  // --- East Asia
  { domain: "justonecookbook.com", cuisines: ["Japanese"] },
  { domain: "nhk.or.jp/recipes", cuisines: ["Japanese"] },
  { domain: "sudachirecipes.com", cuisines: ["Japanese"] },
  { domain: "maangchi.com", cuisines: ["Korean"] },
  { domain: "koreanbapsang.com", cuisines: ["Korean"] },
  { domain: "kimchimari.com", cuisines: ["Korean"] },
  { domain: "redhousespice.com", cuisines: ["Chinese"] },
  { domain: "chinasichuanfood.com", cuisines: ["Chinese"] },
  { domain: "thewoksoflife.com", cuisines: ["Chinese","Chinese-American"] },

  // --- South & SE Asia
  { domain: "vegrecipesofindia.com", cuisines: ["Indian"] },
  { domain: "archanaskitchen.com", cuisines: ["Indian"] },
  { domain: "tarladalal.com", cuisines: ["Indian"] },
  { domain: "hebbarskitchen.com", cuisines: ["Indian"] },
  { domain: "hot-thai-kitchen.com", cuisines: ["Thai"] },
  { domain: "shesimmers.com", cuisines: ["Thai"] },
  { domain: "helenrecipes.com", cuisines: ["Vietnamese"] },
  { domain: "theravenouscouple.com", cuisines: ["Vietnamese"] },

  // --- Mediterranean / Middle East
  { domain: "themediterraneandish.com", cuisines: ["Mediterranean"] },
  { domain: "olivetomato.com", cuisines: ["Greek","Mediterranean"] },
  { domain: "mygreekdish.com", cuisines: ["Greek"] },
  { domain: "maureenabood.com", cuisines: ["Middle Eastern","Levantine"] },
  { domain: "chefindisguise.com", cuisines: ["Middle Eastern"] },
  { domain: "tasteofmaroc.com", cuisines: ["Moroccan","Middle Eastern"] },
  { domain: "marocmama.com", cuisines: ["Moroccan"] },

  // --- Europe & others
  { domain: "giallozafferano.it", cuisines: ["Italian"] },
  { domain: "lacucinaitaliana.it", cuisines: ["Italian"] },
  { domain: "marmiton.org", cuisines: ["French"] },
  { domain: "lacuisinedegeraldine.fr", cuisines: ["French"] },
  { domain: "directoalpaladar.com", cuisines: ["Spanish"] },
  { domain: "recetasderechupete.com", cuisines: ["Spanish"] },

  // --- Africa & diaspora
  { domain: "demandafrica.com", cuisines: ["Pan-African"] },
  { domain: "africanbites.com", cuisines: ["Diaspora","Pan-African"] },
  { domain: "ethiopianfoodguide.com", cuisines: ["Ethiopian"] },

  // --- Americas & regional styles
  { domain: "tudogostoso.com.br", cuisines: ["Brazilian"] },
  { domain: "receitas.globo.com", cuisines: ["Brazilian"] },
  { domain: "ensalpicadas.com", cuisines: ["Caribbean","Puerto Rican"] },
  { domain: "delishdlites.com", cuisines: ["Caribbean"] },
  { domain: "louisianacookin.com", cuisines: ["Cajun/Creole"] },
  { domain: "acadianatable.com", cuisines: ["Cajun/Creole"] },
  { domain: "divascancook.com", cuisines: ["Soul Food"] },
  { domain: "soulfoodandsoutherncooking.com", cuisines: ["Soul Food"] },

  // --- General but culture-respectful
  { domain: "seriouseats.com", cuisines: ["General"] },
  { domain: "cooking.nytimes.com", cuisines: ["General"] },
];

function normalizeCuisine(name) {
  if (!name) return null;
  const x = String(name).toLowerCase();
  if (x.includes("middle eastern")) return "Middle Eastern";
  if (x.includes("cajun") || x.includes("creole")) return "Cajun/Creole";
  const tags = new Set(SOURCE_REGISTRY.flatMap(s => s.cuisines));
  for (const t of tags) if (t.toLowerCase() === x) return t;
  return name;
}

function domainsFromPreferences(userPrefs = {}) {
  const cuisines = Array.isArray(userPrefs.cuisines) ? userPrefs.cuisines : [];
  const wantedTags = new Set(cuisines.map(normalizeCuisine).filter(Boolean));

  // If the user chose cuisines, prefer those domains; else prefer "General"
  const prioritized = SOURCE_REGISTRY.filter(src =>
    wantedTags.size ? src.cuisines.some(c => wantedTags.has(c)) : src.cuisines.includes("General")
  );
  const backfill = SOURCE_REGISTRY.filter(src => !prioritized.includes(src));
  const merged = [...prioritized, ...backfill].map(s => s.domain);
  return Array.from(new Set(merged)).slice(0, 60);
}

function preferredSourcesText(userPrefs) {
  return domainsFromPreferences(userPrefs).map(d => `- ${d}`).join("\n");
}

/* --------------------------------- CORE ---------------------------------- */
// Legacy quick gate
const FORBIDDEN = [/illegal/i, /self\s*harm/i, /hate\s*speech/i, /adult\s*content/i];
const REQUIRED_FIELDS = [
  "title","description","servings","calories","prep","cook","totalTime","servingSize","ingredients","instructions","sources",
];

/* ----------------------- EXPANDED SAFETY FILTERS ------------------------- */
const BAD_WORDS = ["fuck","fucking","shit","bitch","asshole","bastard","cunt","dick","slut","whore"];
const SEXUAL_TERMS = ["sex","sexual","porn","porno","pornographic","nude","naked","nudes","boobs","tits","pussy","vagina","dick","penis","cock","testicles","cum","ejaculate","orgasm","anal","oral sex","blowjob","handjob","masturbate","threesome","hookup","fetish","bdsm","dominatrix","erotic","explicit","nsfw"];
const HATEFUL_PHRASES = ["ugly people","fat people","skinny people","stupid people","retarded","disabled people","crippled","mentally ill people","autistic people","black people","white people","asian people","jewish people","muslim people","gay people","trans people","lesbian people","fag","dyke","tranny","nazi","kkk"];
function containsHateSpeech(text){const s=text.toLowerCase();const foodAdj=/\b(gay|trans|lesbian|queer|black|white|asian|muslim|jewish)\s+(snack|snacks|food|meal|dish|cuisine|recipe)\b/i;if(foodAdj.test(s))return true;return HATEFUL_PHRASES.some(p=>s.includes(p));}
const ED_TERMS=["anorexia","anorexic","anorexia nervosa","bulimia","bulimic","binge eating","binge-eating","bed","arfid","avoidant restrictive","ed recovery","eating disorder","eating-disorder","purge","purging","pro-ana","pro mia"];
const MEDICALIZE=/\b(for|to\s+(treat|cure|help|manage|recover)|help(?:ing)?\s+with|recovery\s+from)\b/i;
const HAZMAT_TERMS=["poison","rat poison","rodenticide","pesticide","insecticide","herbicide","bleach","lye","drain cleaner","detergent","ammonia","antifreeze","gasoline","paint thinner","fertilizer","cyanide","arsenic","mercury","lead"];
const BIO_WASTE_TERMS=["poop","feces","faeces","urine","pee","vomit","vomitus","diarrhea","diarrhoea","blood","semen"];
const VIOLENCE_TERMS=["kill","injure","harm","assault","attack","beat up","stab","shoot","explode","explosive","bomb","molotov","napalm","thermite","gunpowder","flash powder","tannerite","chlorate","peroxide bomb","ammonium nitrate"];
const SELF_HARM_TERMS=["suicide","self harm","self-harm","kill myself","hurt myself","poison myself","overdose","od","cut myself"];
const EXTREMISM_TERMS=["isis","al-qaeda","nazis","neo-nazi","kkk","white supremacist","jihadi","extremist manifesto"];
const DRUGS_ILLEGAL=["cocaine","heroin","meth","methamphetamine","mdma","lsd","dmt","gbl","ghb","fentanyl","ketamine","psilocybin"];
const DRUGS_HOME_BREW=["moonshine","still","distill spirits","illicit alcohol","home distillation"];
const DRUG_SLURS=["crackhead","crack head","meth head","tweaker","junkie","addict","drug addict","cokehead","stoner","druggie"];
const INTOXICATION_SLANG=["coked out","high af","high as fuck","stoned","tripping","trippin","wasted","blackout","blacked out","hammered","plastered","buzzed","drunk af","drunk as hell"];
const CELEBRITY_TERMS=["amber heard","elon musk","donald trump","joe biden","barack obama","hillary clinton","taylor swift","beyonce","rihanna","drake","justin bieber","kanye","kim kardashian","kylie jenner","timothee chalamet","zendaya","lady gaga","bill gates","mark zuckerberg","jeff bezos","putin","xi jinping","trump","obama","biden","hitler","pope francis","pope"];
const CHILD_SAFETY_TERMS=["child","kid","toddler","baby","infant","newborn"];
const INFANT_UNSAFE_FOODS=["honey","raw milk","unpasteurized milk","alcohol","spirits","wine","beer"];
const RAW_UNSAFE_REQUESTS=["raw chicken","raw pork","raw ground beef","undercooked chicken","undercooked pork","pink chicken","raw kidney beans","bitter almonds","raw elderberries","improper cassava"];
const MEDICAL_DISEASE_TERMS=["cancer","diabetes","covid","hypertension","heart disease","alzheim","parkinson","depression","anxiety","adhd","autism","arthritis","stroke","seizure","epilepsy","pcos","endometriosis"];
const MEDICAL_CLAIMS=/\b(cure|treat|reverse|heal|prevent|therapy|therapeutic|dosage|dose|prescribe|prescription)\b/i;
const DIET_CULTURE_TERMS=["cheat meal","cheater food","cheat food","cheater snack","cheat day","cheating food","sinful","bad food","forbidden food","weight loss","fat burning","fat-burning","detox","cleanse","clean eating","burn fat","low calorie diet","starvation","restrictive diet"];
function containsDietCulture(s){const lower=s.toLowerCase();const pattern=/\b(cheat|cheater|guilt|sinful|forbidden)\s+(meal|snack|food|dish|dessert)\b/i;if(pattern.test(lower))return true;return DIET_CULTURE_TERMS.some(t=>lower.includes(t));}

/* ---------------------- FOOD INTENT (ALLOW-LIST) ------------------------- */
const COOKING_VERBS=["cook","bake","roast","grill","sauté","saute","sear","stir-fry","fry","steam","poach","simmer","broil","braise","blanch","knead","marinate","pickle","cure","ferment","whisk","chop","dice","mince","mix","stir","preheat","mise"];
const DISH_WORDS=["recipe","dish","soup","stew","salad","curry","tacos","tortillas","enchiladas","bowl","sandwich","pasta","noodles","ramen","bibimbap","salsa","sauce","dressing","bread","cake","cookie","brownie","muffin","pancake","waffle","omelet","omelette","casserole","risotto","paella","pozole","tamales","ceviche","guacamole","stir fry","stir-fry","steak","burger","burrito","wrap","kebab","shawarma","skewer","chimichurri"];
const FOOD_UNITS=["cup","cups","tbsp","tsp","teaspoon","tablespoon","gram","grams","g","kg","ml","l","liter","litre","ounce","oz","pound","lb","clove","pinch","dash"];
const INGREDIENT_HINTS=["ingredients","ingredient","servings","prep","cook time","preheat","oven","skillet","saucepan"];
const CUISINES=["mexican","korean","indian","japanese","chinese","thai","vietnamese","italian","french","spanish","lebanese","persian","greek","turkish","ethiopian","american","peruvian","brazilian","argentinian","argentine","argentinean","argentina","uruguayan","chilean"];
const DIET_NEUTRAL=["low sodium","low-sodium","low salt","high protein","high-protein","low sugar","no sugar added","gluten-free","dairy-free","vegan","vegetarian","halal","kosher"];
const MEAL_CONTEXT=["dinner","lunch","breakfast","brunch","supper","snack","meal","for two","for 2","date night","cozy","comfort food","rainy day","cold day","weeknight","quick dinner","easy dinner"];
const COMMON_INGREDIENTS=["rice","egg","eggs","chicken","beef","pork","tofu","tomato","onion","garlic","pasta","beans","lentils","cheese","potato","potatoes","bread","milk","flour","butter","oil","spinach","broccoli","mushroom","arroz","huevo","huevos","pollo","res","carne","cerdo","tofu","tomate","cebolla","ajo","pasta","frijoles","lentejas","queso","papa","papas","pan","leche","harina","mantequilla","aceite","espinaca","brócoli","champiñón","steak","sirloin","ribeye","cilantro","parsley","chimichurri","vinegar","olive oil","lime","lemon"];
const COOKING_VERBS_ES=["cocinar","hornear","asar","guisar","freír","saltear","hervir","cocer","marinar","fermentar","mezclar","batir","picar","precalentar"];
const DISH_WORDS_ES=["receta","sopa","estofado","ensalada","curry","tacos","tortillas","enchiladas","salsa","pan","pastel","galleta","tamales","pozole","ceviche","guacamole","asado","chimichurri"];
const FOOD_UNITS_ES=["taza","tazas","cda","cdta","cucharada","cucharadita","gramo","gramos","kg","ml","litro","onza","lb","diente","pizca"];

function hasAny(s, list){return list.some(w=>s.includes(w));}
function containsAnyTerms(s, terms){const hay=` ${s.toLowerCase()} `;return terms.some(t=>hay.includes(` ${t.toLowerCase()} `));}
function containsSexualContent(s){const pattern=/\b(sex|sexual|pussy|dick|cock|boob|penis|vagina|porn|nude|nsfw)\b/i;if(pattern.test(s))return true;return SEXUAL_TERMS.some(t=>s.includes(t));}
function containsDrugSlurOrIntoxication(s){return DRUG_SLURS.some(t=>s.includes(t))||INTOXICATION_SLANG.some(t=>s.includes(t));}
function containsRealPersonReference(s){const lower=s.toLowerCase();if(CELEBRITY_TERMS.some(n=>lower.includes(n)))return true;const explicitBy=/\bby\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/;return explicitBy.test(s);}
function isIngredientOnly(s){const normalized=` ${s.toLowerCase()} `;const joiner=/[,/]|(\sand\s)|(\sy\s)|\bwith\b|\bcon\b/i;const hits=COMMON_INGREDIENTS.filter(w=>normalized.includes(` ${w} `)).length;return hits>=2||(hits>=1&&joiner.test(normalized));}
function isFoodIntent(text){
  const s=` ${text.toLowerCase()} `;
  if(hasAny(s,DISH_WORDS)||hasAny(s,DISH_WORDS_ES))return true;
  if(hasAny(s,COOKING_VERBS)||hasAny(s,COOKING_VERBS_ES))return true;
  if(hasAny(s,CUISINES)&&(hasAny(s,DISH_WORDS)||hasAny(s,COMMON_INGREDIENTS)))return true;
  if((hasAny(s,FOOD_UNITS)||hasAny(s,FOOD_UNITS_ES))&&hasAny(s,INGREDIENT_HINTS))return true;
  if(hasAny(s,MEAL_CONTEXT)&&(hasAny(s,DISH_WORDS)||hasAny(s,COMMON_INGREDIENTS)))return true;
  if(hasAny(s,DIET_NEUTRAL)&&(hasAny(s,DISH_WORDS)||hasAny(s,COMMON_INGREDIENTS)))return true;
  if(isIngredientOnly(s))return true;
  return false;
}

/* ---------------------- VALIDATION (HYBRID ORDER) ------------------------ */
const REASON_MESSAGE={
  empty:"Describe a real dish or ingredients.",
  too_short:"Add a bit more detail to your request.",
  url_code:"No links, code, or SQL please.",
  profanity:"Let's keep things respectful.",
  sexual_explicit:"We can't generate recipes or content with sexual or explicit themes.",
  demeaning_hate:"We can't generate demeaning or hateful content toward any group.",
  ed_medicalized:"We can't generate medicalized recipes for eating-disorder contexts.",
  hazmat:"We can't generate recipes involving poisons or hazardous substances.",
  bio_waste:"We can't generate recipes involving biological waste or bodily fluids.",
  illegal_drugs:"We can't help with illegal drugs.",
  illicit_alcohol:"We can't help with illicit alcohol/distillation.",
  extremism:"We can't generate content related to extremist ideologies.",
  allergy_sabotage:"We can't assist with actions that endanger people with allergies.",
  violence:"We can't assist with violent or harmful intent.",
  self_harm:"We can't assist with self-harm content.",
  infant_unsafe:"That's unsafe for infants. Ask for an age-appropriate recipe.",
  unsafe_raw:"That request involves unsafe raw/undercooked food handling.",
  medical_claims:"We can't make medical claims or therapies; try a general recipe request.",
  diet_culture:"We avoid framing foods as 'cheat' or 'guilt-free.' Try describing the dish itself instead.",
  drug_slur:"We can't generate content using slurs or slang around drug use or intoxication.",
  real_person:"We can't generate recipes or content referencing real people.",
  not_food_intent:"Please ask for a real dish, ingredients, or cooking help."
};
function validatePrompt(text){
  if(!text) return {invalid:true, reason:"empty"};
  const s=String(text).trim(); const sl=s.toLowerCase();
  if(sl.length<3) return {invalid:true, reason:"too_short"};
  if(/(https?:\/\/|```|{[^}]*}\s*$|\bselect\b.*\bfrom\b)/i.test(sl)) return {invalid:true, reason:"url_code"};
  if(new RegExp(`\\b(${BAD_WORDS.join("|")})\\b`,"i").test(sl)) return {invalid:true, reason:"profanity"};
  if(containsSexualContent(sl)) return {invalid:true, reason:"sexual_explicit"};
  if(containsHateSpeech(sl)) return {invalid:true, reason:"demeaning_hate"};
  if(MEDICALIZE.test(sl)&&ED_TERMS.some(t=>sl.includes(t))) return {invalid:true, reason:"ed_medicalized"};
  if(containsAnyTerms(sl,HAZMAT_TERMS)) return {invalid:true, reason:"hazmat"};
  if(containsAnyTerms(sl,BIO_WASTE_TERMS)) return {invalid:true, reason:"bio_waste"};
  if(containsAnyTerms(sl,DRUGS_ILLEGAL)) return {invalid:true, reason:"illegal_drugs"};
  if(containsAnyTerms(sl,DRUGS_HOME_BREW)) return {invalid:true, reason:"illicit_alcohol"};
  if(containsAnyTerms(sl,EXTREMISM_TERMS)) return {invalid:true, reason:"extremism"};
  const ALLERGY_SABOTAGE=/\b(give|hide|sneak)\s+(peanuts?|nut|shellfish|gluten|sesame|dairy)\s+(to|for)\s+(someone|them|friend|family)\b/i;
  if(ALLERGY_SABOTAGE.test(sl)) return {invalid:true, reason:"allergy_sabotage"};
  if(containsAnyTerms(sl,VIOLENCE_TERMS)) return {invalid:true, reason:"violence"};
  if(containsAnyTerms(sl,SELF_HARM_TERMS)) return {invalid:true, reason:"self_harm"};
  if(containsRealPersonReference(s)) return {invalid:true, reason:"real_person"};
  if(containsAnyTerms(sl,CHILD_SAFETY_TERMS)&&containsAnyTerms(sl,INFANT_UNSAFE_FOODS)) return {invalid:true, reason:"infant_unsafe"};
  if(containsAnyTerms(sl,RAW_UNSAFE_REQUESTS)) return {invalid:true, reason:"unsafe_raw"};
  if(MEDICAL_CLAIMS.test(sl)&&containsAnyTerms(sl,MEDICAL_DISEASE_TERMS)) return {invalid:true, reason:"medical_claims"};
  if(containsDietCulture(sl)) return {invalid:true, reason:"diet_culture"};
  if(containsDrugSlurOrIntoxication(sl)) return {invalid:true, reason:"drug_slur"};
  if(!isFoodIntent(text)) return {invalid:true, reason:"not_food_intent"};
  return {invalid:false};
}
function is429(msg=""){const s=msg.toLowerCase();return s.includes("429")||s.includes("too many requests")||s.includes("quota");}

/* ----------------------- ONBOARDING PREFERENCES UTILS -------------------- */
function deriveServings(prefs = {}) {
  const map = { just_me: 1, two_people: 2, three_people: 3, four_people: 4, five_plus: 6 };
  const picks = Array.isArray(prefs.cooking_for) ? prefs.cooking_for : [];
  if (!picks.length) return null;
  return picks.reduce((m, k) => Math.max(m, map[k] || 0), 0) || null;
}
function deriveStyle(prefs = {}) {
  const picks = new Set(Array.isArray(prefs.cooking_style) ? prefs.cooking_style : []);
  return { quick: picks.has("quick"), balanced: picks.has("balanced"), elaborate: picks.has("elaborate"), mealPrep: picks.has("meal_prep") };
}
function deriveDiet(prefs = {}) {
  const diet = new Set((prefs.dietary_pattern || []).map(s => String(s).toLowerCase()));
  const avoid = new Set((prefs.avoidances || []).map(s => String(s).toLowerCase()));
  return { diet, avoid };
}
function deriveGoals(prefs = {}) {
  const g = new Set((prefs.meal_goals || []).map(s => String(s).toLowerCase()));
  return {
    highProtein: g.has("high protein"),
    lowCarb: g.has("low carb"),
    lowCalorie: g.has("low calorie"),
    quick: g.has("quick meals"),
    budget: g.has("budget friendly"),
    mealPrep: g.has("meal prep"),
    kidFriendly: g.has("kid friendly"),
    heartHealthy: g.has("heart healthy"),
  };
}
function buildPreferenceContract(prefs = {}) {
  const servings = deriveServings(prefs);
  const style = deriveStyle(prefs);
  const { diet, avoid } = deriveDiet(prefs);
  const goals = deriveGoals(prefs);
  const cuisines = Array.isArray(prefs.cuisines) ? prefs.cuisines : [];

  const lines = [];
  if (servings) lines.push(`- Target servings: ${servings}`);
  if (style.quick || goals.quick) lines.push(`- Time: prefer totalTime ≤ 30 minutes and ≤ 6 steps.`);
  if (style.elaborate) lines.push(`- Time: elaborate techniques allowed (braise/simmer acceptable).`);
  if (style.mealPrep || goals.mealPrep) lines.push(`- Meal prep friendly: scales well, keeps 3–4 days refrigerated.`);
  if (goals.highProtein) lines.push(`- Macro: emphasize ≥25g protein per serving (use legumes/lean meats/tofu).`);
  if (goals.lowCarb) lines.push(`- Macro: keep starches modest; use veg-forward swaps.`);
  if (goals.lowCalorie) lines.push(`- Macro: calorie-conscious techniques (roast/steam; avoid deep-fry).`);
  if (goals.budget) lines.push(`- Budget: pantry-forward, common items, minimal specialty goods.`);
  if (goals.kidFriendly) lines.push(`- Kid-friendly: mild spice, familiar textures.`);
  if (goals.heartHealthy) lines.push(`- Heart-healthy: favor olive oil, nuts/seeds (if permitted), whole grains; limit saturated fat.`);

  if (diet.size) lines.push(`- Diet: respect patterns ${[...diet].join(", ")}.`);
  if (avoid.size) lines.push(`- Avoid: ${[...avoid].join(", ")} (choose alternatives).`);
  if (cuisines.length) lines.push(`- Cuisine focus: ${cuisines.join(", ")}.`);

  return lines.join("\n");
}

/* ---------- PREFS GATE (added) ---------- */
function hasMeaningfulPrefs(p = {}) {
  if (!p || typeof p !== "object") return false;
  const keys = ["cooking_for","cooking_style","dietary_pattern","avoidances","meal_goals","cuisines"];
  return keys.some(k => Array.isArray(p[k]) && p[k].length > 0);
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

/* --------------------------------- GET/OPTIONS --------------------------- */
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

/* --------------------------------- POST ---------------------------------- */
export async function POST(req) {
  const TRY_TRACE = [];
  try {
    // 🔒 Null-safe, and only use prefs if they're meaningful
    const body = await req.json();
    const prompt = body?.prompt ?? "";
    const rawPrefs = (body?.userPreferences && typeof body.userPreferences === "object") ? body.userPreferences : {};
    const usePrefs = hasMeaningfulPrefs(rawPrefs);
    const userPreferences = usePrefs ? rawPrefs : {};

    const inv = !prompt?.trim() ? { invalid: true, reason: "empty" } : validatePrompt(prompt);
    if (inv.invalid) {
      return NextResponse.json(
        { error: "INVALID_INPUT", reason: inv.reason, message: REASON_MESSAGE[inv.reason] || "Request not allowed." },
        { status: 422 }
      );
    }

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

    // Build profile-aware prompt addenda (conditionally)
    const prefContract = usePrefs ? buildPreferenceContract(userPreferences) : "";
    const domainLines = preferredSourcesText(userPreferences);

    const bigPrompt = `${SYSTEM_RULES}
${usePrefs ? `\nUSER PREFERENCES (strictly follow):\n${prefContract}\n` : ""}
PRIORITIZE CITATIONS FROM THESE DOMAINS (in order):
${domainLines}

Generate a culturally authentic recipe for: ${prompt}
Return ONLY the JSON object described.`;

    // ⚡ CHANGED: Reduce retries to avoid timeout on Vercel free tier (10s limit)
    const MAX_RETRIES_PER_COMBO = 1;
    const BASE_DELAY_MS = 2000;

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

            // Only override with onboarding servings if prefs are meaningful
            const targetServings = usePrefs ? deriveServings(userPreferences) : null;

            data.title = str(data.title, "Untitled Recipe");
            data.description = str(
            data.description,
            "A quick, flavorful dish highlighting fresh ingredients and balanced seasonings."
          );            data.servings = toInt(data.servings || targetServings || 1);
            data.calories = toInt(data.calories || data?.nutrition?.caloriesPerServing || 0);
            data.prep = toInt(data.prep || 0);
            data.cook = toInt(data.cook || 0);
            data.totalTime = Math.max(toInt(data.totalTime || 0), data.prep + data.cook);
            data.servingSize = str(data.servingSize, "1 serving");
            data.ingredients = arr(data.ingredients);
            data.instructions = arr(data.instructions);
            data.toolsNeeded = arr(data.toolsNeeded);
            data.sources = arr(data.sources);
            // Pad to exactly 4 sources if needed
            const defaultSources = [
              { name: "AllRecipes", url: "https://www.allrecipes.com", type: "Recipe Site", learned: "Got basic recipe structure" },
              { name: "Serious Eats", url: "https://www.seriouseats.com", type: "Food Blog", learned: "Got cooking technique tips" },
              { name: "Food Network", url: "https://www.foodnetwork.com", type: "Media", learned: "Got presentation ideas" },
              { name: "Bon Appétit", url: "https://www.bonappetit.com", type: "Food Magazine", learned: "Got ingredient selection guidance" }
            ];
            while (data.sources.length < 4) {
              data.sources.push(defaultSources[data.sources.length]);
            }
            
            // Ensure sources are proper objects with learned field (keep only first 4)
            data.sources = data.sources.slice(0, 4).map((source, idx) => {
              if (typeof source === 'object' && source.name && source.url) {
                return {
                  name: source.name,
                  url: source.url,
                  type: source.type || 'Recipe Source',
                  learned: source.learned || defaultSources[idx]?.learned || 'Got recipe inspiration'
                };
              }
              
              // Parse string format - try multiple patterns
              let name = '';
              let url = '';
              let learned = '';
              const sourceStr = String(source);
              
              // Pattern 1: "Name — URL — learned" or "Name - URL - learned"
              let match = sourceStr.match(/^(.+?)\s*[—-]\s*(.+?)\s*[—-]\s*(.+)$/);
              if (match) {
                name = match[1].trim();
                url = match[2].trim();
                learned = match[3].trim();
              } else {
                // Pattern 2: "Name — URL" or "Name - URL" (no learned)
                match = sourceStr.match(/^(.+?)\s*[—-]\s*(.+)$/);
                if (match) {
                  name = match[1].trim();
                  url = match[2].trim();
                  learned = defaultSources[idx]?.learned || 'Got recipe inspiration';
                } else {
                  // Just a name, no URL
                  name = sourceStr.trim();
                  url = 'https://example.com';
                  learned = defaultSources[idx]?.learned || 'Got recipe inspiration';
                }
              }
              
              // Validate URL has http
              if (!url.startsWith('http')) {
                url = 'https://' + url;
              }
              
              return {
                name: name || 'Source',
                url: url,
                type: 'Recipe Source',
                learned: learned
              };
            });

            // Create complete nutrition object
            if (!data.nutrition || typeof data.nutrition !== 'object') {
              data.nutrition = {};
            }
            // Ensure nutrition has all common fields with defaults
            const nutritionDefaults = {
              protein: '0g',
              carbs: '0g',
              fat: '0g',
              fiber: '0g',
              sodium: '0mg',
              sugar: '0g'
            };
            data.nutrition = {
              ...nutritionDefaults,
              ...data.nutrition
            };

            // Human-friendly time strings with units for UI
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
              const delay = BASE_DELAY_MS;  // ⚡ CHANGED: Fixed 2s delay instead of exponential
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