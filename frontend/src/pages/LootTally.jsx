import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';
import Sigil from '../components/Sigil';
import LOOT from '../../../shared/loot.json';
import { ChevronDown, RefreshCw } from 'lucide-react';

const PRIO_SHORT = { 'PvP': 'PvP', 'Second Build': '2nd', 'PvE': 'PvE' };
const PRIO_DOT = { 'PvP': 'bg-oxblood', 'Second Build': 'bg-brass', 'PvE': 'bg-emerald-500' };
const PRIO_TEXT = { 'PvP': 'text-oxblood', 'Second Build': 'text-brass', 'PvE': 'text-emerald-400' };
const PRIO_INDEX = Object.fromEntries(LOOT.priorities.map((p, i) => [p, i]));
const ALL_ITEMS = LOOT.categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.label })));

export default function LootTally() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [tally, setTally] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');
  const [showZero, setShowZero] = useState(false);
  const [open, setOpen] = useState(() => new Set());

  const load = () => {
    setLoading(true); setError('');
    axios.get('/api/loot')
      .then((res) => { setCounts(res.data.counts || {}); setTally(res.data.tally || {}); })
      .catch((err) => setError(err.response?.data?.error || 'Could not load the tally.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const f = filter.toLowerCase();
    return ALL_ITEMS
      .map((it) => {
        const watchers = [...(tally[it.key] || [])].sort((a, b) =>
          (PRIO_INDEX[a.priority] - PRIO_INDEX[b.priority]) || (a.name || '').localeCompare(b.name || ''));
        const byPrio = {};
        LOOT.priorities.forEach((p) => { byPrio[p] = 0; });
        watchers.forEach((w) => { if (byPrio[w.priority] != null) byPrio[w.priority]++; });
        return { ...it, total: counts[it.key] || 0, watchers, byPrio };
      })
      .filter((it) => (showZero || it.total > 0)
        && (!category || it.category === category)
        && (it.name.toLowerCase().includes(f) || it.category.toLowerCase().includes(f)))
      .sort((a, b) => (b.total - a.total) || a.name.localeCompare(b.name));
  }, [counts, tally, filter, category, showZero]);

  const stats = useMemo(() => {
    const wanted = ALL_ITEMS.filter((it) => (counts[it.key] || 0) > 0).length;
    const totalPicks = Object.values(counts).reduce((a, n) => a + n, 0);
    return { wanted, totalPicks };
  }, [counts]);

  const toggle = (key) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  if (!user?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Sigil className="w-12 h-16 text-oxblood mx-auto mb-6" />
        <h1 className="font-display text-2xl text-bone tracking-[0.08em] mb-3">Restricted</h1>
        <p className="text-ash">The war table is open to officers of the house alone.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow text-brass text-[11px] mb-3">War Table</div>
          <h1 className="font-display text-4xl md:text-5xl text-bone tracking-[0.08em]">Loot Tally</h1>
          <p className="text-ash mt-2">Every wishlisted item by demand, with who wants it and how.</p>
        </div>
        {!loading && !error && (
          <div className="flex gap-6 text-right">
            <div><div className="font-mono text-3xl text-brassbright">{stats.wanted}</div><div className="eyebrow text-[10px] text-ash mt-1">items wanted</div></div>
            <div><div className="font-mono text-3xl text-bone">{stats.totalPicks}</div><div className="eyebrow text-[10px] text-ash mt-1">total picks</div></div>
          </div>
        )}
      </div>
      <div className="rule-fade my-8" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search items…"
          className="bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass w-full max-w-xs"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-panel border border-line rounded-sm px-3 py-2.5 text-bone focus:outline-none focus:border-brass">
          <option value="">All categories</option>
          {LOOT.categories.map((c) => <option key={c.key} value={c.label}>{c.label}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-ash cursor-pointer select-none">
          <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} className="accent-brass" />
          Show unwanted
        </label>
        <div className="flex-1" />
        <button onClick={load} className="inline-flex items-center gap-2 text-sm text-ash hover:text-brass"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {error ? (
        <div className="panel rounded-sm p-8 text-center">
          <p className="text-ash mb-6">{error}</p>
          <button onClick={load} className="px-6 py-2.5 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm">Try again</button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-ash">Counting the claims…</div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-ash">{showZero ? 'No items.' : 'No one has wishlisted anything yet.'}</div>
      ) : (
        <div className="panel rounded-sm divide-y divide-line">
          {rows.map((it) => {
            const isOpen = open.has(it.key);
            const canOpen = it.watchers.length > 0;
            return (
              <div key={it.key}>
                <button
                  onClick={() => canOpen && toggle(it.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${canOpen ? 'hover:bg-panelup' : 'cursor-default'} transition-colors`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-bone truncate">{it.name}</div>
                    <div className="eyebrow text-[10px] text-ash mt-0.5">{it.category}</div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {LOOT.priorities.map((p) => (
                      <span key={p} className={`inline-flex items-center gap-1 text-xs font-mono ${it.byPrio[p] ? PRIO_TEXT[p] : 'text-ash/30'}`} title={p}>
                        <span className={`w-2 h-2 rounded-full ${it.byPrio[p] ? PRIO_DOT[p] : 'bg-line'}`} />
                        {it.byPrio[p]}
                      </span>
                    ))}
                  </div>

                  <div className="w-10 text-right font-mono text-brassbright shrink-0">{it.total}</div>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${canOpen ? 'text-ash' : 'text-transparent'} ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && canOpen && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {it.watchers.map((w, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs bg-hall border border-line rounded-full px-3 py-1 text-bone">
                        <span className={`w-2 h-2 rounded-full ${PRIO_DOT[w.priority] || 'bg-line'}`} />
                        {w.name}
                        <span className="text-ash">· {PRIO_SHORT[w.priority] || w.priority}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
