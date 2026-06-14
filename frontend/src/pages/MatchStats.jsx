import { Trophy, Target, Heart, Sword } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

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
        if (res.data.length > 0) {
          setSelectedMatchId(res.data[0].id); // auto-select first match
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Load match detail when selection changes
  useEffect(() => {
    if (!selectedMatchId) return;

    setMatchDetail(null);
    axios.get(`/api/match/${selectedMatchId}`)
      .then(res => setMatchDetail(res.data))
      .catch(err => console.error(err));
  }, [selectedMatchId]);

  const selectedMatch = matchDetail?.match;
  const players = matchDetail?.players || [];

  // Top 10 Kills, Damage, Healing
  const topKills = [...players].sort((a, b) => (b.kills || 0) - (a.kills || 0)).slice(0, 10);
  const topDamage = [...players].sort((a, b) => (b.damage_dealt || 0) - (a.damage_dealt || 0)).slice(0, 10);
  const topHealing = [...players].sort((a, b) => (b.healing || 0) - (a.healing || 0)).slice(0, 10);

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

            {/* Top 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <Top10Card title="Top 10 Kills" icon={<Sword className="w-8 h-8" />} data={topKills} field="kills" />
              <Top10Card title="Top 10 Damage" icon={<Target className="w-8 h-8" />} data={topDamage} field="damage_dealt" unit="M" />
              <Top10Card title="Top 10 Healing" icon={<Heart className="w-8 h-8" />} data={topHealing} field="healing" unit="M" />
            </div>

            {/* Full Ranked List */}
            <div className="mt-16">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <Trophy className="w-6 h-6" /> Full Player Rankings
              </h3>
              <div className="bg-[#0f0d13] rounded-2xl overflow-hidden border border-[#c9973a]/20">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#c9973a]/30">
                      <th className="text-left p-5 text-sm text-[#9c9384]">Rank</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Player</th>
                      <th className="text-left p-5 text-sm text-[#9c9384]">Guild</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Kills</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Assists</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Damage</th>
                      <th className="text-center p-5 text-sm text-[#9c9384]">Healing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={i} className="border-b border-[#c9973a]/10 hover:bg-[#1a1724]">
                        <td className="p-5 font-mono text-[#c9973a]">{p.rank}</td>
                        <td className="p-5 font-semibold">{p.player_name}</td>
                        <td className="p-5 text-[#9c9384]">{p.guild_name}</td>
                        <td className="p-5 text-center font-bold text-[#e8c96b]">{p.kills}</td>
                        <td className="p-5 text-center">{p.assists}</td>
                        <td className="p-5 text-center">{(p.damage_dealt / 1000000).toFixed(1)}M</td>
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

// Top 10 Card Component
function Top10Card({ title, icon, data, field, unit = "" }) {
  return (
    <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-3xl p-8">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="space-y-4">
        {data.slice(0, 10).map((player, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[#9c9384]">{player.player_name}</span>
            <span className="font-bold text-[#e8c96b]">
              {field === 'damage_dealt' || field === 'healing' 
                ? (player[field] / 1000000).toFixed(1) + unit 
                : player[field]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}