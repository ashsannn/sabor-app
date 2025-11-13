// Map for unicode vulgar fractions → ascii
const VULGAR = { '½': '1/2','⅓': '1/3','⅔': '2/3','¼': '1/4','¾': '3/4',
  '⅛': '1/8','⅜': '3/8','⅝': '5/8','⅞': '7/8' };

const UNIT_ALIASES = {
  cup: ['cup','cups'],
  tbsp: ['tbsp','tablespoon','tablespoons'],
  tsp: ['tsp','teaspoon','teaspoons'],
};

const COUNT_UNITS = ['clove','cloves','egg','eggs','can','cans','piece','pieces'];

function toAsciiFractions(s) {
  return s.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (m) => VULGAR[m] || m);
}

function parseQty(str) {
  // supports "1 3/4", "3/8", "1.25", "1 ¼", etc.
  const s = toAsciiFractions(str).trim();
  // mixed number
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  // simple fraction
  m = s.match(/^(\d+)\/(\d+)/);
  if (m) return Number(m[1]) / Number(m[2]);
  // decimal or integer
  m = s.match(/^\d+(\.\d+)?/);
  if (m) return Number(m[0]);
  return null;
}

// convert decimal to a nice fraction (quarters/thirds/eighths)
function fractionStr(x) {
  const fracMap = [
    [0, ''],
    [1/8, '1/8'], [2/8, '1/4'], [3/8, '3/8'],
    [1/3, '1/3'], [4/8, '1/2'], [5/8, '5/8'],
    [2/3, '2/3'], [6/8, '3/4'], [7/8, '7/8'], [1, ''],
  ];
  let best = 0, label = '';
  for (const [v, l] of fracMap) {
    if (Math.abs(x - v) < Math.abs(x - best)) { best = v; label = l; }
  }
  return [best, label];
}

function formatNumberAsMixed(n) {
  const whole = Math.floor(n + 1e-6);
  const frac = n - whole;
  const [best, label] = fractionStr(frac);
  const w = whole + (best === 1 ? 1 : 0);
  const f = (best === 1 ? '' : label);
  if (w && f) return `${w} ${f}`;
  if (w) return String(w);
  if (f) return f;
  return '0';
}

function normalizeVolume(qty, unit) {
  // returns {qty, unit} normalized between cup/tbsp/tsp with sensible rounding
  const u = unit.toLowerCase();
  const isCup = UNIT_ALIASES.cup.includes(u);
  const isTbsp = UNIT_ALIASES.tbsp.includes(u);
  const isTsp = UNIT_ALIASES.tsp.includes(u);

  let cups = 0;

  if (isCup) cups = qty;
  else if (isTbsp) cups = qty / 16;
  else if (isTsp) cups = qty / 48;
  else return { qty, unit }; // unknown unit → leave as-is

  // promote/demote with thresholds
  if (cups >= 1/4) {
    // Round cups to nearest 1/4, keep thirds if close
    const frac = cups - Math.floor(cups);
    const thirds = [1/3, 2/3];
    const closeThird = thirds.find(t => Math.abs(frac - t) < 0.04);
    let rounded = closeThird != null
      ? Math.round((Math.floor(cups) + closeThird) * 100) / 100
      : Math.round(cups * 4) / 4; // nearest quarter
    return { qty: rounded, unit: 'cup' };
  }

  // < 1/4 cup → show tablespoons/teaspoons
  let tbsp = cups * 16; // exact
  // If >= 4 tbsp, go back to cups
  if (tbsp >= 4 - 1e-6) {
    return { qty: 1/4, unit: 'cup' };
  }
  // Round tbsp to nearest 1/2
  tbsp = Math.round(tbsp * 2) / 2;
  if (tbsp >= 1) return { qty: tbsp, unit: 'Tbsp' };

  // Convert to tsp if < 1 Tbsp
  let tsp = cups * 48;
  // Round tsp to nearest 1/4
  tsp = Math.round(tsp * 4) / 4;
  return { qty: tsp, unit: 'tsp' };
}

export function prettifyIngredient(line) {
  // Strip bullet
  let s = line.replace(/^[•\-\u2022]\s*/, '').trim();

  // Extract leading qty + unit
  // e.g., "1 3/4 cup", "5/16 cup", "3.5 tablespoons", "2 tsp"
  const m = toAsciiFractions(s).match(/^(\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?)\s+([a-zA-Z]+)\b/);
  if (!m) return s; // can't parse → return original

  const qtyRaw = m[1];
  const unitRaw = m[2];
  const qty = parseQty(qtyRaw);
  if (qty == null) return s;

  // Count-based units → round to nearest 1/2, keep unit
  if (COUNT_UNITS.includes(unitRaw.toLowerCase())) {
    const rounded = Math.round(qty * 2) / 2;
    const nice = formatNumberAsMixed(rounded);
    return s.replace(qtyRaw, nice);
  }

  // Volume normalization (cup/Tbsp/tsp)
  const { qty: q2, unit: u2 } = normalizeVolume(qty, unitRaw);

  // Format pretty number (mixed with nice fractions)
  const nice = formatNumberAsMixed(q2);

  // Replace first qty+unit occurrence with normalized
  const head = `${qtyRaw} ${unitRaw}`;
  const repl = `${nice} ${u2}`;
  return s.replace(head, repl);
}