// backend/ingest.js — turn a screenshot or CSV into draft player rows.
// Screenshots go through Gemini vision; CSVs are parsed directly. Both produce
// the same row shape, which the admin reviews and edits before committing.
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Papa = require('papaparse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Model names churn — keep this swappable without a code change.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// The exact weapon tokens our class map understands. Gemini must choose from
// these so weapon_1 + weapon_2 resolve to a class downstream.
const WEAPONS = ['SnS', 'Greatsword', 'Daggers', 'Crossbow', 'Longbow', 'Staff', 'Wand', 'Spear', 'Orb'];

const PROMPT = `You are reading a Throne and Liberty wargame results screen. Extract EVERY player row into JSON.

Return ONLY a JSON object of this exact shape:
{
  "players": [
    {
      "rank": <integer>,
      "weapon_1": <one of: ${WEAPONS.join(', ')}>,
      "weapon_2": <one of the same list>,
      "guild_name": <string>,
      "player_name": <string, keep non-Latin characters exactly>,
      "team_color": <"Red" or "Yellow">,
      "kills": <integer>,
      "assists": <integer>,
      "damage_dealt": <integer>,
      "damage_taken": <integer>,
      "healing": <integer>
    }
  ]
}

Column mapping on the screen:
- "Ranking" -> rank
- The two weapon icons -> weapon_1 (left) and weapon_2 (right). Identify each from the list above by its icon: SnS = sword + shield, Greatsword = large two-handed sword, Daggers = twin short blades, Crossbow = paired crossbows, Longbow = bow, Staff = mage staff, Wand = wand + tome/book, Spear = polearm, Orb = sphere. If unsure, give your best guess.
- "Guild" -> guild_name (the text only; ignore the emblem)
- "Name" -> player_name
- "Team" -> team_color
- "Defeat" -> kills
- "Assist" -> assists
- "Damage Dealt" -> damage_dealt
- "Damage Taken" -> damage_taken
- "Amount Healed" -> healing

Rules:
- IGNORE the pinned "My Rank" row at the very top — it is a duplicate of that player's own ranked line and must NOT be included.
- Strip thousands separators: "3,254,684" becomes 3254684.
- If a number is blank or unreadable, use 0.
- Return players in ranking order. Output JSON only, no prose.`;

async function parseScreenshot(buffer, mimeType) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — screenshot reading is unavailable.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  });

  const result = await model.generateContent([
    { text: PROMPT },
    { inlineData: { mimeType, data: buffer.toString('base64') } },
  ]);

  const text = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini did not return valid JSON. Try a clearer screenshot.');
  }

  const players = Array.isArray(parsed.players) ? parsed.players.map(normalizeRow) : [];
  return { players, warnings: buildWarnings(players, 'screenshot') };
}

// ── CSV ──────────────────────────────────────────────────────────────────────
// Accept either the in-game column names or our field names (case-insensitive).
const HEADER_MAP = {
  ranking: 'rank', rank: 'rank',
  weapon_1: 'weapon_1', weapon1: 'weapon_1', 'weapon 1': 'weapon_1',
  weapon_2: 'weapon_2', weapon2: 'weapon_2', 'weapon 2': 'weapon_2',
  guild: 'guild_name', guild_name: 'guild_name', guildname: 'guild_name',
  name: 'player_name', player: 'player_name', player_name: 'player_name', playername: 'player_name',
  team: 'team_color', team_color: 'team_color', teamcolor: 'team_color',
  defeat: 'kills', kills: 'kills', kill: 'kills',
  assist: 'assists', assists: 'assists',
  'damage dealt': 'damage_dealt', damage_dealt: 'damage_dealt', damagedealt: 'damage_dealt', dealt: 'damage_dealt',
  'damage taken': 'damage_taken', damage_taken: 'damage_taken', damagetaken: 'damage_taken', taken: 'damage_taken',
  'amount healed': 'healing', healing: 'healing', healed: 'healing', heal: 'healing',
};

function parseCsv(text) {
  const out = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => HEADER_MAP[h.trim().toLowerCase()] || h.trim().toLowerCase(),
  });

  const players = (out.data || [])
    .map((raw) => {
      const row = {};
      for (const key of Object.keys(raw)) {
        if (['rank','weapon_1','weapon_2','guild_name','player_name','team_color','kills','assists','damage_dealt','damage_taken','healing'].includes(key)) {
          row[key] = raw[key];
        }
      }
      return normalizeRow(row);
    })
    // Drop fully empty rows and any leftover "My Rank" lines
    .filter((p) => p.player_name && !/^my\s*rank$/i.test(p.player_name));

  return { players, warnings: buildWarnings(players, 'csv') };
}

// ── shared normalization ─────────────────────────────────────────────────────
function toInt(v) {
  if (v === null || v === undefined) return 0;
  const n = parseInt(String(v).replace(/[, ]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTeam(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s.startsWith('r')) return 'Red';
  if (s.startsWith('y')) return 'Yellow';
  return '';
}

function cleanWeapon(v) {
  const s = String(v || '').trim();
  const match = WEAPONS.find((w) => w.toLowerCase() === s.toLowerCase());
  return match || s; // keep the raw value if it isn't a known token, so the admin can fix it
}

function normalizeRow(r = {}) {
  return {
    rank: toInt(r.rank),
    weapon_1: cleanWeapon(r.weapon_1),
    weapon_2: cleanWeapon(r.weapon_2),
    guild_name: String(r.guild_name || '').trim(),
    player_name: String(r.player_name || '').trim(),
    team_color: normalizeTeam(r.team_color),
    kills: toInt(r.kills),
    assists: toInt(r.assists),
    damage_dealt: toInt(r.damage_dealt),
    damage_taken: toInt(r.damage_taken),
    healing: toInt(r.healing),
  };
}

function buildWarnings(players, source) {
  const warnings = [];
  if (players.length === 0) {
    warnings.push('No player rows were detected — check the file and try again.');
    return warnings;
  }
  const missingTeam = players.filter((p) => !p.team_color).length;
  if (missingTeam) warnings.push(`${missingTeam} row(s) have no team color set.`);
  const badWeapon = players.filter((p) => !WEAPONS.includes(p.weapon_1) || !WEAPONS.includes(p.weapon_2)).length;
  if (badWeapon && source === 'screenshot') {
    warnings.push(`${badWeapon} row(s) have a weapon that needs checking — icons are the least reliable field.`);
  }
  return warnings;
}

module.exports = { parseScreenshot, parseCsv, WEAPONS };
