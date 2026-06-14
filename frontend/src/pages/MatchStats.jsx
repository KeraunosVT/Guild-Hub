import { Trophy, Target, Heart, Sword } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MatchStats() {
  const [overallStats, setOverallStats] = useState({});
  const [guildStats, setGuildStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overall, ftp, push, hr, br] = await Promise.all([
          axios.get('/api/stats/summary'),
          axios.get('/api/stats/summary?guild=FTP'),
          axios.get('/api/stats/summary?guild=PUSH'),
          axios.get('/api/stats/summary?guild=House Regard'),
          axios.get('/api/stats/summary?guild=Best Regards')
        ]);

        setOverallStats(overall.data);

        setGuildStats([
          { name: 'FTP', ...ftp.data },
          { name: 'PUSH', ...push.data },
          { name: 'House Regard', ...hr.data },
          { name: 'Best Regards', ...br.data }
        ]);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07060a] flex items-center justify-center">
        <div className="text-[#c9973a] text-xl">Loading Match Stats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <h1 className="text-5xl font-bold text-[#e8c96b] mb-2">Match Stats</h1>
        <p className="text-[#9c9384]">Season Overview • Guild Performance</p>

        {/* Overall Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[#0f0d13] border border-[#c9973a]/30 rounded-3xl p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-[#c9973a]" />
            <div className="text-6xl font-bold text-[#e8c96b]">{overallStats.totalMatches || 0}</div>
            <div className="uppercase tracking-widest text-sm text-[#9c9384] mt-3">Total Matches</div>
          </div>
          <div className="bg-[#0f0d13] border border-[#c9973a]/30 rounded-3xl p-8 text-center">
            <Sword className="w-12 h-12 mx-auto mb-4 text-[#c9973a]" />
            <div className="text-6xl font-bold text-[#e8c96b]">{overallStats.totalKills || 0}</div>
            <div className="uppercase tracking-widest text-sm text-[#9c9384] mt-3">Total Kills</div>
          </div>
          <div className="bg-[#0f0d13] border border-[#c9973a]/30 rounded-3xl p-8 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-[#c9973a]" />
            <div className="text-6xl font-bold text-[#e8c96b]">{overallStats.totalDamage || "0.0M"}</div>
            <div className="uppercase tracking-widest text-sm text-[#9c9384] mt-3">Total Damage</div>
          </div>
          <div className="bg-[#0f0d13] border border-[#c9973a]/30 rounded-3xl p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-[#c9973a]" />
            <div className="text-6xl font-bold text-[#e8c96b]">{overallStats.totalHealing || "0.0M"}</div>
            <div className="uppercase tracking-widest text-sm text-[#9c9384] mt-3">Total Healing</div>
          </div>
        </div>

        {/* Guild Breakdown */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#e8c96b] mb-8">Guild Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guildStats.map(g => (
              <div key={g.name} className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-6">
                <div className="font-bold text-xl mb-6 text-[#e8c96b]">{g.name}</div>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-[#9c9384]">MATCHES</div>
                    <div className="text-4xl font-bold text-white">{g.totalMatches || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9c9384]">KILLS</div>
                    <div className="text-4xl font-bold text-white">{g.totalKills || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9c9384]">DAMAGE</div>
                    <div className="text-4xl font-bold text-white">{g.totalDamage || "0.0M"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#9c9384]">HEALING</div>
                    <div className="text-4xl font-bold text-white">{g.totalHealing || "0.0M"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}