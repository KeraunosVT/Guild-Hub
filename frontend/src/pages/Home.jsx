import { Trophy, Users, Sword, TrendingUp, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [stats, setStats] = useState({});
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, matchesRes] = await Promise.all([
          axios.get('/api/stats/summary'),
          axios.get('/api/matches/recent?limit=6')
        ]);
        setStats(statsRes.data);
        setRecentMatches(matchesRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#07060a] text-[#e8e2d4]">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-[#c9973a]/20">
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
            <a href="/dashboard" 
               className="group px-12 py-5 bg-[#c9973a] hover:bg-[#e8c96b] text-black font-bold text-xl rounded-2xl transition-all flex items-center gap-3 justify-center">
              <Trophy className="w-6 h-6 group-hover:rotate-12 transition" />
              Dashboard
            </a>
            <a href="/war-room" 
               className="px-12 py-5 border-2 border-[#c9973a] hover:bg-[#c9973a]/10 text-[#e8c96b] font-bold text-xl rounded-2xl transition">
              War Room
            </a>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 bg-[#0a0810]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-[#c9973a] uppercase tracking-widest text-sm mb-12">Guild Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
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
        </div>
      </section>

      {/* Recent Matches */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#e8c96b] mb-12 text-center">Recent Matches</h2>
          
          {loading ? (
            <p className="text-center text-[#9c9384]">Loading matches...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentMatches.length > 0 ? recentMatches.map(match => (
                <div key={match.id} className="bg-[#0f0d13] border border-[#c9973a]/20 rounded-2xl p-6 hover:border-[#e8c96b] transition">
                  <div className="text-[#c9973a] text-sm mb-2">{new Date(match.date).toLocaleDateString()}</div>
                  <div className="font-semibold text-lg mb-4">{match.title}</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[#e8c96b]">{match.kills}</div>
                      <div className="text-[#9c9384]">Kills</div>
                    </div>
                    <div>
                      <div className="text-[#e8c96b]">{match.damage}</div>
                      <div className="text-[#9c9384]">Damage</div>
                    </div>
                    <div>
                      <div className="text-[#e8c96b]">{match.healing}</div>
                      <div className="text-[#9c9384]">Healing</div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-[#9c9384] col-span-3">No matches recorded yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}