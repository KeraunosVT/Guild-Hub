import { Trophy, Target, Heart, Sword, Calendar, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Weapon to Class Mapping
const weaponToClass = {
  "CrossbowDaggers": "Scorpion",
  "CrossbowGreatsword": "Outrider",
  "CrossbowLongbow": "Scout",
  "CrossbowOrb": "Crucifix",
  "CrossbowSnS": "Raider",
  "CrossbowSpear": "Cavalier",
  "CrossbowStaff": "Battleweaver",
  "CrossbowWand": "Fury",
  "DaggersOrb": "Lunarch",
  "DaggersWand": "Darkblighter",
  "GreatswordDaggers": "Ravager",
  "GreatswordLongbow": "Ranger",
  "GreatswordOrb": "Justicar",
  "GreatswordSpear": "Gladiator",
  "GreatswordWand": "Paladin",
  "LongbowDaggers": "Infiltrator",
  "LongbowOrb": "Scryer",
  "SnSDaggers": "Berserker",
  "SnSGreatsword": "Crusader",
  "SnSLongbow": "Warden",
  "SnSOrb": "Guardian",
  "SnSSpear": "Steelheart",
  "SnSStaff": "Disciple",
  "SnSWand": "Templar",
  "SpearDaggers": "Shadowdancer",
  "SpearLongbow": "Impaler",
  "SpearOrb": "Polaris",
  "SpearWand": "Voidlance",
  "StaffDaggers": "Spellblade",
  "StaffGreatsword": "Sentinel",
  "StaffLongbow": "Liberator",
  "StaffOrb": "Enigma",
  "StaffSpear": "Eradicator",
  "StaffWand": "Invocator",
  "WandLongbow": "Seeker",
  "WandOrb": "Oracle"
};

function getClassName(weapon1, weapon2) {
  if (!weapon1) return "Unknown";
  const key = (weapon1 + (weapon2 || "")).replace(/\s+/g, '');
  return weaponToClass[key] || `${weapon1} ${weapon2 || ''}`.trim();
}

export default function MatchStats() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... existing useEffects for loading matches and details ...

  const selectedMatch = matchDetail?.match;
  const players = matchDetail?.players || [];
  const classBreakdown = matchDetail?.classBreakdown || [];

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-[#e8c96b] mb-2">Match Stats</h1>
        <p className="text-[#9c9384]">Detailed performance per match</p>

        {/* Match Dropdown */}
        <div className="mt-8 max-w-lg">
          <label className="block text-sm text-[#9c9384] mb-2">Select Match</label>
          <select
            value={selectedMatchId || ''}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full bg-[#0f0d13] border border-[#c9973a]/30 rounded-xl p-4 text-lg focus:outline-none focus:border-[#e8c96b]"
          >
            <option value="">— Select a match —</option>
            {matches.map(match => (
              <option key={match.id} value={match.id}>
                {new Date(match.match_date).toLocaleDateString()} — {match.title}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-[#e8c96b] mb-1">{selectedMatch.title}</h2>
            <p className="text-[#9c9384]">{new Date(selectedMatch.match_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

            {/* Top 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Keep your Top 10 cards here */}
            </div>

            {/* Class Breakdown Chart */}
            <div className="mt-16">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6" /> Class Distribution
              </h3>
              <div className="bg-[#0f0d13] rounded-2xl p-8 border border-[#c9973a]/20">
                <div className="space-y-6">
                  {classBreakdown.map(({ name, count }) => (
                    <div key={name} className="flex items-center gap-4">
                      <div className="w-32 text-right font-medium text-[#e8c96b]">{name}</div>
                      <div className="flex-1 bg-[#1a1724] rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#c9973a] to-[#e8c96b]"
                          style={{ width: `${Math.max(8, (count / Math.max(...classBreakdown.map(c => c.count))) * 100)}%` }}
                        />
                      </div>
                      <div className="w-12 font-mono text-right text-[#e8c96b]">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Table */}
            {/* ... your existing table ... */}
          </div>
        )}
      </div>
    </div>
  );
}