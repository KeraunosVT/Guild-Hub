import { Trophy, Sword, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/stats/summary')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
          
          <p className="text-2xl text-[#9c9384] max-w-2xl mx-auto mb-12">
            Elite Competitive Guild • Organized Warfare • Relentless Execution
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="/dashboard" className="px-12 py-5 bg-[#c9973a] hover:bg-[#e8c96b] text-black font-bold text-xl rounded-2xl transition flex items-center gap-3 justify-center">
              <Trophy className="w-6 h-6" />
              Go to Dashboard
            </a>
            <a href="/war-room" className="px-12 py-5 border-2 border-[#c9973a] hover:bg-white/5 text-[#e8c96b] font-bold text-xl rounded-2xl transition">
              War Room
            </a>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 bg-[#0a0810]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-6xl font-bold text-[#e8c96b]">{stats.totalMatches || '—'}</div>
            <div className="mt-3 text-sm tracking-widest text-[#9c9384]">MATCHES RECORDED</div>
          </div>
          <div>
            <div className="text-6xl font-bold text-[#e8c96b]">{stats.totalKills || '—'}</div>
            <div className="mt-3 text-sm tracking-widest text-[#9c9384]">TOTAL KILLS</div>
          </div>
          <div>
            <div className="text-6xl font-bold text-[#e8c96b]">{stats.totalDamage || '—'}</div>
            <div className="mt-3 text-sm tracking-widest text-[#9c9384]">TOTAL DAMAGE</div>
          </div>
          <div>
            <div className="text-6xl font-bold text-[#e8c96b]">{stats.totalHealing || '—'}</div>
            <div className="mt-3 text-sm tracking-widest text-[#9c9384]">TOTAL HEALING</div>
          </div>
        </div>
      </section>
    </div>
  );
}