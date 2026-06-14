import { Trophy, Target, Heart, Sword, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MatchStats() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load recent matches
  useEffect(() => {
    axios.get('/api/matches/recent?limit=20')
      .then(res => setMatches(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const loadMatchDetail = async (matchId) => {
    try {
      const res = await axios.get(`/api/match/${matchId}`);
      setSelectedMatch(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-[#e8c96b] mb-2">Match Stats</h1>
        <p className="text-[#9c9384]">Detailed performance breakdown per match</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          {/* Match List */}
          <div className="lg:col-span-5">
            <h2 className="text-xl font-semibold text-[#c9973a] mb-6">Recent Matches</h2>
            
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
              {matches.map(match => (
                <div
                  key={match.id}
                  onClick={() => loadMatchDetail(match.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:border-[#e8c96b] ${
                    selectedMatch?.match?.id === match.id 
                      ? 'border-[#e8c96b] bg-[#1a1724]' 
                      : 'border-[#c9973a]/20 hover:bg-[#0f0d13]'
                  }`}
                >
                  <div className="text-sm text-[#c9973a]">
                    {new Date(match.match_date).toLocaleDateString()}
                  </div>
                  <div className="font-semibold mt-1">{match.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Detail View */}
          <div className="lg:col-span-7">
            {selectedMatch ? (
              <div>
                <button 
                  onClick={() => setSelectedMatch(null)}
                  className="flex items-center gap-2 text-[#c9973a] hover:text-white mb-6"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to List
                </button>

                <h2 className="text-3xl font-bold text-[#e8c96b] mb-2">{selectedMatch.match.title}</h2>
                <p className="text-[#9c9384]">{new Date(selectedMatch.match.match_date).toLocaleDateString()}</p>

                <div className="mt-10">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                    <Trophy className="w-6 h-6" /> Player Rankings
                  </h3>

                  <div className="bg-[#0f0d13] rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#c9973a]/20">
                          <th className="text-left p-4 text-[#9c9384] text-sm">Rank</th>
                          <th className="text-left p-4 text-[#9c9384] text-sm">Player</th>
                          <th className="text-left p-4 text-[#9c9384] text-sm">Guild</th>
                          <th className="text-center p-4 text-[#9c9384] text-sm">Kills</th>
                          <th className="text-center p-4 text-[#9c9384] text-sm">Assists</th>
                          <th className="text-center p-4 text-[#9c9384] text-sm">Damage</th>
                          <th className="text-center p-4 text-[#9c9384] text-sm">Healing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMatch.players.map((player, idx) => (
                          <tr key={idx} className="border-b border-[#c9973a]/10 hover:bg-[#1a1724]">
                            <td className="p-4 font-mono text-[#c9973a]">{player.rank}</td>
                            <td className="p-4 font-semibold">{player.player_name}</td>
                            <td className="p-4 text-[#9c9384]">{player.guild_name}</td>
                            <td className="p-4 text-center font-bold text-[#e8c96b]">{player.kills}</td>
                            <td className="p-4 text-center">{player.assists}</td>
                            <td className="p-4 text-center">{(player.damage_dealt / 1000000).toFixed(1)}M</td>
                            <td className="p-4 text-center">{(player.healing / 1000000).toFixed(1)}M</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[70vh] flex items-center justify-center text-[#9c9384]">
                Select a match from the list to view detailed stats
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}