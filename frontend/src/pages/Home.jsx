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
      {/* Smaller Hero */}
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden border-b border-[#c9973a]/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#c9973a15_0%,transparent_70%)]" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 text-[#c9973a] tracking-[4px] text-sm mb-6">
            ⚔️ THRONE &amp; LIBERTY ⚔️
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-[#e8c96b] mb-6">
            HOUSE REGARD
          </h1>
          <p className="text-xl text-[#9c9384] mb-10">Elite Competitive Guild • Organized Warfare</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard" 
               className="group px-10 py-4 bg-[#c9973a] hover:bg-[#e8c96b] text-black font-bold text-lg rounded-2xl transition-all flex items-center gap-3 justify-center">
              <Trophy className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/war-room" 
               className="px-10 py-4 border-2 border-[#c9973a] hover:bg-white/5 text-[#e8c96b] font-bold text-lg rounded-2xl transition">
              War Room
            </a>
          </div>
        </div>
      </section>

      {/* Guild Filter */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-20 pb-8">
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
      <section className="py-16 bg-[#0a0810]">
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