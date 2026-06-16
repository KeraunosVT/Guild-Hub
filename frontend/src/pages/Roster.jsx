import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import weaponToClass from '../../../shared/weaponClasses.json';
import { ArrowUp, ArrowDown } from 'lucide-react';

function getClassName(w1, w2) {
  if (!w1) return '—';
  const a = (w1 || '').trim();
  const b = (w2 || '').trim();
  return weaponToClass[a + b] || weaponToClass[b + a] || `${a} ${b}`.trim() || '—';
}

const fmt = (n) => (Number(n) || 0).toLocaleString();
const fmtM = (n) => ((Number(n) || 0) / 1e6).toFixed(1) + 'M';

const COLUMNS = [
  { key: 'player_name', label: 'Player', align: 'left', kind: 'text' },
  { key: 'class', label: 'Class', align: 'left', kind: 'class' },
  { key: 'matches', label: 'Matches', align: 'right', kind: 'num' },
  { key: 'kills', label: 'Kills', align: 'right', kind: 'num' },
  { key: 'assists', label: 'Assists', align: 'right', kind: 'num' },
  { key: 'damage_dealt', label: 'Dmg Dealt', align: 'right', kind: 'm' },
  { key: 'damage_taken', label: 'Dmg Taken', align: 'right', kind: 'm' },
  { key: 'healing', label: 'Healing', align: 'right', kind: 'm' },
];

export default function Roster() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('kills');
  const [sortDir, setSortDir] = useState('desc');

  const fetchPlayers = () => {
    setLoading(true); setError(false);
    axios.get('/api/players')
      .then((res) => setPlayers((res.data.players || []).map((p) => ({ ...p, class: getClassName(p.weapon_1, p.weapon_2) }))))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlayers(); }, []);

  const sortBy = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir(key === 'player_name' || key === 'class' ? 'asc' : 'desc'); }
  };

  const rows = useMemo(() => {
    const f = filter.toLowerCase();
    const list = players.filter((p) => (p.player_name || '').toLowerCase().includes(f));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string' || typeof vb === 'string') return String(va || '').localeCompare(String(vb || '')) * dir;
      return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
    });
  }, [players, filter, sortKey, sortDir]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="eyebrow text-brass text-[11px] mb-3">The Roll</div>
      <h1 className="font-display text-4xl md:text-5xl text-bone tracking-[0.08em]">Roster of the House</h1>
      <p className="text-ash mt-2">Every member's all-time record across every engagement.</p>
      <div className="rule-fade my-8" />

      <div className="flex items-center justify-between mb-5 gap-4">
        <input
          value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search members…"
          className="bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass w-full max-w-xs"
        />
        {!loading && !error && <span className="text-sm text-ash shrink-0">{rows.length} members</span>}
      </div>

      {error ? (
        <div className="panel rounded-sm p-8 text-center">
          <div className="font-display text-oxblood tracking-wide text-lg mb-2">The roll is sealed</div>
          <p className="text-ash mb-6">The record couldn't be read. Try again.</p>
          <button onClick={fetchPlayers} className="px-6 py-2.5 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm transition-colors">Try again</button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-ash">Reading the roll…</div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-ash">No members on record yet.</div>
      ) : (
        <div className="panel rounded-sm overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line">
              <tr className="eyebrow text-[10px] text-ash">
                <th className="p-4 text-center font-normal w-12">#</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={`p-4 font-normal cursor-pointer hover:text-bone select-none ${c.align === 'right' ? 'text-right' : 'text-left'}`} onClick={() => sortBy(c.key)}>
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {sortKey === c.key && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3 text-brass" /> : <ArrowUp className="w-3 h-3 text-brass" />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.player_name + i} className="border-b border-line/60 hover:bg-panelup transition-colors">
                  <td className="p-4 text-center font-mono text-ash">{i + 1}</td>
                  <td className="p-4 font-semibold text-bone">{p.player_name}</td>
                  <td className="p-4 text-brassbright">{p.class}</td>
                  <td className="p-4 text-right font-mono text-bone">{fmt(p.matches)}</td>
                  <td className="p-4 text-right font-mono text-brassbright">{fmt(p.kills)}</td>
                  <td className="p-4 text-right font-mono text-bone">{fmt(p.assists)}</td>
                  <td className="p-4 text-right font-mono text-bone">{fmtM(p.damage_dealt)}</td>
                  <td className="p-4 text-right font-mono text-bone">{fmtM(p.damage_taken)}</td>
                  <td className="p-4 text-right font-mono text-bone">{fmtM(p.healing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
