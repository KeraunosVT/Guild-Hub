import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth';
import Sigil from '../components/Sigil';
import weaponToClass from '../../../shared/weaponClasses.json';
import { UploadCloud, Plus, Trash2, X, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';

const WEAPONS = ['SnS', 'Greatsword', 'Daggers', 'Crossbow', 'Longbow', 'Staff', 'Wand', 'Spear', 'Orb'];
const STAT_COLS = ['kills', 'assists', 'damage_dealt', 'damage_taken', 'healing'];

// Class options + reverse map (class -> [weapon_1, weapon_2]), derived from the
// shared weapon→class table so the DB keeps storing weapons.
const CLASS_LIST = [...new Set(Object.values(weaponToClass))].sort();
const CLASS_TO_WEAPONS = (() => {
  const map = {};
  const splitKey = (key) => {
    for (const w1 of WEAPONS) {
      if (key.startsWith(w1)) {
        const rest = key.slice(w1.length);
        if (WEAPONS.includes(rest)) return [w1, rest];
      }
    }
    return null;
  };
  for (const [key, cls] of Object.entries(weaponToClass)) {
    const pair = splitKey(key);
    if (pair && !map[cls]) map[cls] = pair;
  }
  return map;
})();
const weaponsToClass = (w1, w2) => {
  const a = (w1 || '').trim();
  const b = (w2 || '').trim();
  return weaponToClass[a + b] || weaponToClass[b + a] || '';
};

const emptyRow = () => ({
  rank: '', weapon_1: '', weapon_2: '', guild_name: '', player_name: '',
  team_color: '', kills: 0, assists: 0, damage_dealt: 0, damage_taken: 0, healing: 0,
});

export default function Admin() {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [players, setPlayers] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  if (!user?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Sigil className="w-12 h-16 text-oxblood mx-auto mb-6" />
        <h1 className="font-display text-2xl text-bone tracking-[0.08em] mb-3">Restricted</h1>
        <p className="text-ash">The war table is open to officers of the house alone.</p>
      </div>
    );
  }

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...incoming.filter((f) => !names.has(f.name + f.size))];
    });
    setError('');
  };
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const parse = async () => {
    if (files.length === 0) return;
    setParsing(true); setError(''); setDone(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      const res = await axios.post('/api/admin/match/parse', form);
      setPlayers(res.data.players || []);
      setWarnings(res.data.warnings || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not read those files.');
      setPlayers(null);
    } finally {
      setParsing(false);
    }
  };

  const updateCell = (i, key, value) =>
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  const updateClass = (i, className) => {
    const pair = CLASS_TO_WEAPONS[className] || ['', ''];
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, weapon_1: pair[0], weapon_2: pair[1] } : p)));
  };
  const addRow = () => setPlayers((prev) => [...(prev || []), emptyRow()]);
  const removeRow = (i) => setPlayers((prev) => prev.filter((_, idx) => idx !== i));

  const commit = async () => {
    setCommitting(true); setError('');
    try {
      const res = await axios.post('/api/admin/match/commit', { title, match_date: matchDate, players });
      setDone(res.data);
      setPlayers(null); setFiles([]); setTitle(''); setMatchDate(''); setWarnings([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the match.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="eyebrow text-brass text-[11px] mb-3">War Table</div>
      <h1 className="font-display text-4xl md:text-5xl text-bone tracking-[0.08em]">Upload a Match</h1>
      <p className="text-ash mt-2">Read results screenshots or a CSV, review every row, then commit it to the record.</p>
      <div className="rule-fade my-10" />

      {done && (
        <div className="mb-8 panel rounded-sm p-6 border-brass/40">
          <div className="font-display text-brassbright text-lg tracking-[0.06em] mb-1">Logged to the record</div>
          <p className="text-ash">{done.inserted} players saved. <Link to="/war-record" className="text-brass hover:text-brassbright">View the war record →</Link></p>
        </div>
      )}

      {error && (
        <div className="mb-8 px-5 py-4 border border-oxblood/50 bg-oxblooddeep/20 rounded-sm text-bone">{error}</div>
      )}

      {/* Step 1 — upload */}
      {!players && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <label className="block panel rounded-sm border-dashed border-2 border-line hover:border-brass/50 transition-colors cursor-pointer p-10 text-center">
              <input
                type="file" accept="image/*,.csv" multiple className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <UploadCloud className="w-8 h-8 text-brass mx-auto mb-4" />
              <div className="text-ash">
                Click to choose screenshots (select several at once) or a CSV
              </div>
            </label>

            {files.length > 0 && (
              <div className="panel rounded-sm divide-y divide-line">
                {files.map((f, i) => (
                  <div key={f.name + f.size} className="flex items-center gap-3 px-4 py-2.5">
                    {/\.csv$/i.test(f.name) ? <FileSpreadsheet className="w-4 h-4 text-brass shrink-0" /> : <ImageIcon className="w-4 h-4 text-brass shrink-0" />}
                    <span className="text-sm text-bone truncate flex-1">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-ash hover:text-oxblood" aria-label="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="eyebrow text-[10px] text-ash block mb-2">Match title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Castle Siege — Abyssal"
                className="w-full bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="eyebrow text-[10px] text-ash block mb-2">Match date</label>
              <input
                type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass"
              />
            </div>
            <button
              onClick={parse} disabled={files.length === 0 || parsing}
              className="w-full px-6 py-3 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {parsing ? 'Reading…' : `Read ${files.length || ''} file${files.length === 1 ? '' : 's'}`.trim()}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — review & edit */}
      {players && (
        <div>
          {warnings.length > 0 && (
            <div className="mb-6 px-5 py-4 border border-brass/40 bg-panel rounded-sm text-sm text-bone">
              <div className="eyebrow text-[10px] text-brass mb-2">Check before saving</div>
              <ul className="list-disc pl-5 space-y-1 text-ash">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-bone tracking-[0.08em]">Review — {players.length} players</h2>
            <button onClick={addRow} className="inline-flex items-center gap-2 text-sm text-brass hover:text-brassbright">
              <Plus className="w-4 h-4" /> Add row
            </button>
          </div>

          <div className="panel rounded-sm overflow-auto max-h-[640px] mb-8">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="sticky top-0 bg-panelup border-b border-line">
                <tr className="eyebrow text-[10px] text-ash">
                  <th className="p-3 text-left font-normal w-16">Rank</th>
                  <th className="p-3 text-left font-normal">Class</th>
                  <th className="p-3 text-left font-normal">Guild</th>
                  <th className="p-3 text-left font-normal">Name</th>
                  <th className="p-3 text-left font-normal">Team</th>
                  <th className="p-3 text-left font-normal">Kills</th>
                  <th className="p-3 text-left font-normal">Assists</th>
                  <th className="p-3 text-left font-normal">Dmg Dealt</th>
                  <th className="p-3 text-left font-normal">Dmg Taken</th>
                  <th className="p-3 text-left font-normal">Healing</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const cls = weaponsToClass(p.weapon_1, p.weapon_2);
                  return (
                    <tr key={i} className="border-b border-line/60">
                      <td className="p-1.5"><NumCell value={p.rank} onChange={(v) => updateCell(i, 'rank', v)} w="w-14" /></td>
                      <td className="p-1.5">
                        <select
                          value={cls} onChange={(e) => updateClass(i, e.target.value)}
                          className={`bg-hall border rounded px-2 py-1.5 focus:outline-none focus:border-brass w-40 ${cls ? 'border-line text-bone' : 'border-oxblood/60 text-oxblood'}`}
                        >
                          <option value="">— set class —</option>
                          {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-1.5"><TextCell value={p.guild_name} onChange={(v) => updateCell(i, 'guild_name', v)} /></td>
                      <td className="p-1.5"><TextCell value={p.player_name} onChange={(v) => updateCell(i, 'player_name', v)} /></td>
                      <td className="p-1.5">
                        <select
                          value={p.team_color} onChange={(e) => updateCell(i, 'team_color', e.target.value)}
                          className="bg-hall border border-line rounded px-2 py-1.5 text-bone focus:outline-none focus:border-brass w-24"
                        >
                          <option value="">—</option>
                          <option value="Yellow">Yellow</option>
                          <option value="Red">Red</option>
                        </select>
                      </td>
                      {STAT_COLS.map((col) => (
                        <td key={col} className="p-1.5"><NumCell value={p[col]} onChange={(v) => updateCell(i, col, v)} /></td>
                      ))}
                      <td className="p-1.5 text-center">
                        <button onClick={() => removeRow(i)} className="text-ash hover:text-oxblood" aria-label="Remove row">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={commit} disabled={committing || players.length === 0}
              className="px-8 py-3 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm transition-colors disabled:opacity-40"
            >
              {committing ? 'Saving…' : `Commit ${players.length} players`}
            </button>
            <button onClick={() => { setPlayers(null); setWarnings([]); }} className="px-6 py-3 text-ash hover:text-bone transition-colors">
              Discard
            </button>
            <span className="text-sm text-ash">{title || 'Untitled match'}{matchDate ? ` · ${matchDate}` : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TextCell({ value, onChange }) {
  return (
    <input
      value={value ?? ''} onChange={(e) => onChange(e.target.value)}
      className="bg-hall border border-line rounded px-2 py-1.5 text-bone focus:outline-none focus:border-brass w-full min-w-[120px]"
    />
  );
}

function NumCell({ value, onChange, w = 'w-24' }) {
  return (
    <input
      type="number" value={value ?? 0} onChange={(e) => onChange(e.target.value)}
      className={`bg-hall border border-line rounded px-2 py-1.5 text-bone font-mono focus:outline-none focus:border-brass ${w}`}
    />
  );
}
