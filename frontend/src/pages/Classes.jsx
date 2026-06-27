import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';
import weaponToClass from '../../../shared/weaponClasses.json';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const CLASS_LIST = [...new Set(Object.values(weaponToClass))].sort();

export default function Classes() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState({});

  const canEdit = (id) => user && (user.isAdmin || user.id === id);

  const load = () => {
    setLoading(true); setError('');
    axios.get('/api/classes')
      .then((res) => setMembers(res.data.members || []))
      .catch((err) => setError(err.response?.data?.error || 'Could not load classes.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const saveClass = (member, field, value) => {
    const updated = { ...member, [field]: value };
    setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
    setStatus((s) => ({ ...s, [member.id]: 'saving' }));
    axios.put(`/api/classes/${member.id}`, {
      pvp_class: updated.pvp_class, pve_class: updated.pve_class, display_name: member.name,
    })
      .then(() => {
        setStatus((s) => ({ ...s, [member.id]: 'saved' }));
        setTimeout(() => setStatus((s) => ({ ...s, [member.id]: undefined })), 1800);
      })
      .catch(() => setStatus((s) => ({ ...s, [member.id]: 'error' })));
  };

  const ordered = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      if (user && a.id === user.id) return -1;
      if (user && b.id === user.id) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    const f = filter.toLowerCase();
    return sorted.filter((m) => (m.name || '').toLowerCase().includes(f));
  }, [members, filter, user]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="eyebrow text-brass text-[11px] mb-3">Members Area</div>
      <h1 className="font-display text-4xl md:text-5xl text-bone tracking-[0.08em]">Classes</h1>
      <p className="text-ash mt-2">
        {user?.isAdmin
          ? 'Set PvP and PvE classes for every member.'
          : 'Set your PvP and PvE class. Others are read-only.'}
      </p>
      <div className="rule-fade my-8" />

      <div className="flex items-center justify-between mb-5 gap-4">
        <input
          value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search members…"
          className="bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass w-full max-w-xs"
        />
        <button onClick={load} className="inline-flex items-center gap-2 text-sm text-ash hover:text-brass shrink-0">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-5 py-3 rounded-sm border border-oxblood/50 bg-oxblooddeep/20 text-bone text-sm">{error}</div>
      )}

      {loading ? (
        <div className="py-20 text-center text-ash">Reading the rolls…</div>
      ) : ordered.length === 0 ? (
        <div className="py-20 text-center text-ash">No members found.</div>
      ) : (
        <div className="panel rounded-sm overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line">
              <tr className="eyebrow text-[10px] text-ash">
                <th className="p-4 text-left font-normal">Member</th>
                <th className="p-4 text-left font-normal">PvP Class</th>
                <th className="p-4 text-left font-normal">PvE Class</th>
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((m) => {
                const mine = user && m.id === user.id;
                const editable = canEdit(m.id);
                return (
                  <tr key={m.id} className={`border-b border-line/60 ${mine ? 'bg-brass/5' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {m.avatar
                          ? <img src={m.avatar} alt="" className="w-6 h-6 rounded-full border border-line shrink-0" />
                          : <span className="w-6 h-6 rounded-full bg-panelup border border-line shrink-0 flex items-center justify-center text-[10px] text-brass">{(m.name || '?').slice(0, 1).toUpperCase()}</span>}
                        <span className="text-bone truncate max-w-[160px]">{m.name}</span>
                        {mine && <span className="text-[9px] eyebrow text-brass border border-brass/40 rounded-full px-1.5 py-0.5">You</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      {editable ? (
                        <select
                          value={m.pvp_class || ''} onChange={(e) => saveClass(m, 'pvp_class', e.target.value)}
                          className="bg-hall border border-line rounded px-3 py-1.5 text-bone focus:outline-none focus:border-brass w-40"
                        >
                          <option value="">— not set —</option>
                          {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className={`font-medium ${m.pvp_class ? 'text-brassbright' : 'text-ash/40'}`}>{m.pvp_class || '—'}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editable ? (
                        <select
                          value={m.pve_class || ''} onChange={(e) => saveClass(m, 'pve_class', e.target.value)}
                          className="bg-hall border border-line rounded px-3 py-1.5 text-bone focus:outline-none focus:border-brass w-40"
                        >
                          <option value="">— not set —</option>
                          {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className={`font-medium ${m.pve_class ? 'text-emerald-400' : 'text-ash/40'}`}>{m.pve_class || '—'}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {status[m.id] === 'saving' && <Loader2 className="w-4 h-4 text-ash animate-spin inline" />}
                      {status[m.id] === 'saved' && <Check className="w-4 h-4 text-emerald-400 inline" />}
                      {status[m.id] === 'error' && <AlertCircle className="w-4 h-4 text-oxblood inline" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
