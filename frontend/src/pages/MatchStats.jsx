import { Trophy, Target, Heart, Sword, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Weapon to Class Mapping (order doesn't matter)
const weaponToClass = {
  "CrossbowDagger": "Scorpion",
  "CrossbowGreatsword": "Outrider",
  "CrossbowLongbow": "Scout",
  "CrossbowOrb": "Crucifix",
  "CrossbowSnS": "Raider",
  "CrossbowSpear": "Cavalier",
  "CrossbowStaff": "Battleweaver",
  "CrossbowWand": "Fury",
  "DaggerOrb": "Lunarch",
  "DaggerWand": "Darkblighter",
  "GreatswordDagger": "Ravager",
  "GreatswordLongbow": "Ranger",
  "GreatswordOrb": "Justicar",
  "GreatswordSpear": "Gladiator",
  "GreatswordWand": "Paladin",
  "LongbowDagger": "Infiltrator",
  "LongbowOrb": "Scryer",
  "SnSDagger": "Berserker",
  "SnSGreatsword": "Crusader",
  "SnSLongbow": "Warden",
  "SnSOrb": "Guardian",
  "SnSSpear": "Steelheart",
  "SnSStaff": "Disciple",
  "SnSWand": "Templar",
  "SpearDagger": "Shadowdancer",
  "SpearLongbow": "Impaler",
  "SpearOrb": "Polaris",
  "SpearWand": "Voidlance",
  "StaffDagger": "Spellblade",
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

  const w1 = weapon1.trim();
  const w2 = weapon2 ? weapon2.trim() : "";

  // Try both orders
  let key = (w1 + w2).replace(/\s+/g, '');
  if (weaponToClass[key]) return weaponToClass[key];

  key = (w2 + w1).replace(/\s+/g, '');
  if (weaponToClass[key]) return weaponToClass[key];

  // Fallback
  return `${w1} ${w2}`.trim();
}

export default function MatchStats() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load recent matches
  useEffect(() => {
    axios.get('/api/matches/recent?limit=30')
      .then(res => {
        setMatches(res.data);
        if (res.data.length > 0) setSelectedMatchId(res.data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Load selected match
  useEffect(() => {
    if (!selectedMatchId) return;
    setMatchDetail(null);
    axios.get(`/api/match/${selectedMatchId}`)
      .then(res => setMatchDetail(res.data))
      .catch(err => console.error(err));
  }, [selectedMatchId]);

  const selectedMatch = matchDetail?.match;
  const players = matchDetail?.players || [];

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-[#e8c96b] mb-2">Match Stats</h1>
        <p className="text-[#9c9384]">Detailed performance per match</p>

        {/* Match Selector */}
        <div className="mt-8 max-w-md">
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
            <p className="text-[#9c9384]">
              {new Date(selectedMatch.match_date).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </p>

            {/* Full Player Rankings */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Sword className="w-6 h-6" /> Player Performance
              </h3>

              <div className="bg-[#0f0d13] rounded-2xl overflow-hidden border border-[#c9973a]/20">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#c9973a]/30 bg-[#1a1724]">
                      <th className="text-left p-5 text-sm text-[#9c9384]">Rank</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Class</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Guild</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Player Name</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Kills</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Assists</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Damage Dealt</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Damage Taken</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Healing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={i} className="border-b border-[#c9973a]/10 hover:bg-[#1a1724]">
                        <td className="p-5 font-mono text-[#c9973a]">{p.rank}</td>
                        <td className="p-5 font-medium text-[#e8c96b]">
                          {getClassName(p.weapon_1, p.weapon_2)}
                        </td>
                        <td className="p-5 text-[#9c9384]">{p.guild_name}</td>
                        <td className="p-5 font-semibold">{p.player_name}</td>
                        <td className="p-5 text-center font-bold text-[#e8c96b]">{p.kills}</td>
                        <td className="p-5 text-center">{p.assists}</td>
                        <td className="p-5 text-center">{(p.damage_dealt / 1000000).toFixed(1)}M</td>
                        <td className="p-5 text-center">{(p.damage_taken / 1000000).toFixed(1)}M</td>
                        <td className="p-5 text-center">{(p.healing / 1000000).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}