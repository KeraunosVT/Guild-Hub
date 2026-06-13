import { Trophy, Target, Heart, Sword } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [stats, setStats] = useState({});
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [loading, setLoading] = useState(true);

  const guilds = ['FTP', 'PUSH', 'House Regard', 'Best Regards'];

  const fetchStats = async (guild = null) => {
    setLoading(true);
    try {
      const url = guild 
        ? `/api/stats/summary?guild=${encodeURIComponent(guild)}` 
        : '/api/stats/summary';
      
      const res = await axios.get(url);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedGuild);
  }, [selectedGuild]);

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4]">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#c9973a15_0%,transparent_70%)]" />
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-3 text-[#c9973a] tracking-[4px] text-sm mb-6">
            ⚔️ THRONE &amp; LIBERTY ⚔️
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter text-[#e8c96b] mb-6">
            HOUSE REGARD
          </h1>
          <p className="text-2xl text-[#9c9384] mb-12">Elite Competitive Guild</p>
        </div>
      </section>

      {/* Guild Filter */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20 pb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSelectedGuild(null)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${!selectedGuild ? 'bg-[#c9973a] text-black' : 'bg-[#1a1724] hover:bg-[#2a2638] text-[#e8e2d4]'}`}
          >
            All Guilds
          </button>
          {guilds.map(guild => (
            <button
              key={guild}
              onClick={() => setSelectedGuild(guild)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${selectedGuild === guild ? 'bg-[#c9973a] text-black' : 'bg-[#1a1724] hover:bg-[#2a2638] text-[#e8e2d4]'}`}
            >
              {guild}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <section className="py-12 bg-[#0a0810]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-8 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-4 text-[#c9973a]" />
              <div className="text-5xl font-bold text-[#e8c96b]">{stats.totalMatches || 0}</div>
              <div className="text-sm tracking-widest text-[#9c9384] mt-2">MATCHES</div>
            </div>

            <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-8 text-center">
              <Sword className="w-10 h-10 mx-auto mb-4 text-[#c9973a]" />
              <div className="text-5xl font-bold text-[#e8c96b]">{stats.totalKills || 0}</div>
              <div className="text-sm tracking-widest text-[#9c9384] mt-2">TOTAL KILLS</div>
            </div>

            <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-8 text-center">
              <Target className="w-10 h-10 mx-auto mb-4 text-[#c9973a]" />
              <div className="text-5xl font-bold text-[#e8c96b]">{stats.totalDamage || "0.0M"}</div>
              <div className="text-sm tracking-widest text-[#9c9384] mt-2">TOTAL DAMAGE</div>
            </div>

            <div className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-8 text-center">
              <Heart className="w-10 h-10 mx-auto mb-4 text-[#c9973a]" />
              <div className="text-5xl font-bold text-[#e8c96b]">{stats.totalHealing || "0.0M"}</div>
              <div className="text-sm tracking-widest text-[#9c9384] mt-2">TOTAL HEALING</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}