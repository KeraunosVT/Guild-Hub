import { Sword, Target, Heart, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Weapon to Class Mapping
const weaponToClass = {
  "CrossbowDaggers": "Scorpion", "CrossbowGreatsword": "Outrider", "CrossbowLongbow": "Scout",
  "CrossbowOrb": "Crucifix", "CrossbowSnS": "Raider", "CrossbowSpear": "Cavalier",
  "CrossbowStaff": "Battleweaver", "CrossbowWand": "Fury", "DaggersOrb": "Lunarch",
  "DaggersWand": "Darkblighter", "GreatswordDaggers": "Ravager", "GreatswordLongbow": "Ranger",
  "GreatswordOrb": "Justicar", "GreatswordSpear": "Gladiator", "GreatswordWand": "Paladin",
  "LongbowDaggers": "Infiltrator", "LongbowOrb": "Scryer", "SnSDaggers": "Berserker",
  "SnSGreatsword": "Crusader", "SnSLongbow": "Warden", "SnSOrb": "Guardian",
  "SnSSpear": "Steelheart", "SnSStaff": "Disciple", "SnSWand": "Templar",
  "SpearDaggers": "Shadowdancer", "SpearLongbow": "Impaler", "SpearOrb": "Polaris",
  "SpearWand": "Voidlance", "StaffDaggers": "Spellblade", "StaffGreatsword": "Sentinel",
  "StaffLongbow": "Liberator", "StaffOrb": "Enigma", "StaffSpear": "Eradicator",
  "StaffWand": "Invocator", "WandLongbow": "Seeker", "WandOrb": "Oracle"
};

function getClassName(weapon1, weapon2) {
  if (!weapon1) return "Unknown";
  const w1 = weapon1.trim();
  const w2 = weapon2 ? weapon2.trim() : "";

  let key = (w1 + w2).replace(/\s+/g, '');
  if (weaponToClass[key]) return weaponToClass[key];

  key = (w2 + w1).replace(/\s+/g, '');
  if (weaponToClass[key]) return weaponToClass[key];

  return `${w1} ${w2}`.trim();
}

export default function MatchStats() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/matches/recent?limit=30')
      .then(res => {
        setMatches(res.data);
        if (res.data.length > 0) setSelectedMatchId(res.data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    setMatchDetail(null);
    axios.get(`/api/match/${selectedMatchId}`)
      .then(res => setMatchDetail(res.data))
      .catch(err => console.error(err));
  }, [selectedMatchId]);

  const selectedMatch = matchDetail?.match;
  const players = matchDetail?.players || [];
  const classBreakdown = matchDetail?.classBreakdown || [];

  const topKills = [...players].sort((a, b) => (b.kills || 0) - (a.kills || 0)).slice(0, 10);
  const topDamage = [...players].sort((a, b) => (b.damage_dealt || 0) - (a.damage_dealt || 0)).slice(0, 10);
  const topDamageTaken = [...players].sort((a, b) => (b.damage_taken || 0) - (a.damage_taken || 0)).slice(0, 10);
  const topHealing = [...players].sort((a, b) => (b.healing || 0) - (a.healing || 0)).slice(0, 10);

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4] pb-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-5xl font-bold text-[#e8c96b]">Match Stats</h1>
            <p className="text-[#9c9384] mt-1">Detailed breakdown per wargame</p>
          </div>

          <div className="w-full md:w-96">
            <select
              value={selectedMatchId || ''}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full bg-[#0f0d13] border border-[#c9973a]/40 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-[#e8c96b]"
            >
              <option value="">— Select a match —</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {new Date(m.match_date).toLocaleDateString()} — {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedMatch && (
          <>
            <h2 className="text-3xl font-bold text-[#e8c96b] mb-1">{selectedMatch.title}</h2>
            <p className="text-[#9c9384] mb-12">
              {new Date(selectedMatch.match_date).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </p>

            {/* 4 Team Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <TeamStatCard title="Total Kills" value="—" icon={<Sword />} />
              <TeamStatCard title="Damage Dealt" value="—" icon={<Target />} unit="M" />
              <TeamStatCard title="Damage Taken" value="—" icon={<Target />} unit="M" />
              <TeamStatCard title="Total Healing" value="—" icon={<Heart />} unit="M" />
            </div>

            {/* Top 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Top10Card title="Top Kills" icon={<Sword />} data={topKills} field="kills" />
              <Top10Card title="Top Damage Dealt" icon={<Target />} data={topDamage} field="damage_dealt" unit="M" />
              <Top10Card title="Top Damage Taken" icon={<Target />} data={topDamageTaken} field="damage_taken" unit="M" />
              <Top10Card title="Top Healing" icon={<Heart />} data={topHealing} field="healing" unit="M" />
            </div>

            {/* Clean Class Breakdown Card */}
            <div className="mb-16">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Users className="w-6 h-6" /> Class Distribution
              </h3>
              <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-3xl p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {classBreakdown.length > 0 ? classBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#1a1724] rounded-2xl px-5 py-4">
                      <span className="font-medium text-[#e8c96b]">{item.name}</span>
                      <div className="text-right">
                        <span className="font-mono text-lg">{item.count}</span>
                        <span className="text-xs text-[#9c9384] ml-2">
                          ({((item.count / classBreakdown.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="col-span-full text-center py-8 text-[#9c9384]">No class data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Full Player Rankings - Scrollable */}
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Sword className="w-6 h-6" /> Full Player Rankings
              </h3>
              <div className="bg-[#0f0d13] rounded-2xl border border-[#c9973a]/20 overflow-auto max-h-[620px]">
                <table className="w-full min-w-[900px]">
                  <thead className="sticky top-0 bg-[#1a1724] border-b border-[#c9973a]/30">
                    <tr>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Rank</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Class</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Guild</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Player</th>
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
                        <td className="p-5 font-medium text-[#e8c96b]">{getClassName(p.weapon_1, p.weapon_2)}</td>
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
          </>
        )}
      </div>
    </div>
  );
}

/* ====================== SUB COMPONENTS ====================== */

function TeamStatCard({ title, value, icon, unit = "" }) {
  return (
    <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-3xl p-8 text-center">
      <div className="flex justify-center mb-4 text-[#e8c96b]">{icon}</div>
      <div className="text-4xl font-bold text-[#e8c96b] mb-1">{value}</div>
      <div className="text-sm text-[#9c9384] uppercase tracking-widest">{title}</div>
    </div>
  );
}

function Top10Card({ title, icon, data, field, unit = "" }) {
  return (
    <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="space-y-3 text-sm">
        {data.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-[#9c9384]">{p.player_name}</span>
            <span className="font-bold text-[#e8c96b]">
              {unit ? (p[field] / 1000000).toFixed(1) + unit : p[field]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}