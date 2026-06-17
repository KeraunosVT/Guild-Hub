import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';
import Sigil from '../components/Sigil';
import { RefreshCw, Camera, Trash2, ChevronDown, Users, CalendarDays, Loader2 } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [snapped, setSnapped] = useState([]);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});

  const loadChannels = () => {
    axios.get('/api/admin/voice-channels')
      .then((res) => setChannels(res.data.channels || []))
      .catch(() => setChannels([]));
  };

  const loadEvents = () => {
    setLoadingEvents(true);
    axios.get('/api/admin/events')
      .then((res) => setEvents(res.data.events || []))
      .catch((err) => setError(err.response?.data?.error || 'Could not load events.'))
      .finally(() => setLoadingEvents(false));
  };

  useEffect(() => { loadChannels(); loadEvents(); }, []);

  if (!user?.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Sigil className="w-12 h-16 text-oxblood mx-auto mb-6" />
        <h1 className="font-display text-2xl text-bone tracking-[0.08em] mb-3">Restricted</h1>
        <p className="text-ash">The war table is open to officers of the house alone.</p>
      </div>
    );
  }

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const snap = () => {
    if (!selectedChannel) return;
    axios.get(`/api/admin/voice-channels/${selectedChannel}/members`)
      .then((res) => {
        const members = res.data.members || [];
        if (members.length === 0) { flash('No one is in that channel right now.', false); return; }
        setSnapped(members);
        flash(`Snapped ${members.length} member${members.length === 1 ? '' : 's'}.`);
      })
      .catch(() => flash('Could not read voice channel.', false));
  };

  const removeSnapped = (id) => setSnapped((prev) => prev.filter((m) => m.id !== id));

  const save = async () => {
    if (!title.trim()) { flash('Give this event a title.', false); return; }
    if (snapped.length === 0) { flash('Snap a voice channel first.', false); return; }
    setSaving(true); setError('');
    try {
      const res = await axios.post('/api/admin/events', {
        title, event_date: eventDate || null, attendees: snapped,
      });
      flash(`Saved — ${res.data.attendees} attendees logged.`);
      setSnapped([]); setTitle(''); setEventDate('');
      loadEvents();
    } catch (err) {
      flash(err.response?.data?.error || 'Could not save event.', false);
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event and its attendance records?')) return;
    try {
      await axios.delete(`/api/admin/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (expanded === id) { setExpanded(null); setDetail((d) => { const n = { ...d }; delete n[id]; return n; }); }
      flash('Event deleted.');
    } catch (err) {
      flash(err.response?.data?.error || 'Delete failed.', false);
    }
  };

  const toggleEvent = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (detail[id]) return;
    try {
      const res = await axios.get(`/api/admin/events/${id}`);
      setDetail((d) => ({ ...d, [id]: res.data.attendees || [] }));
    } catch {
      flash('Could not load attendees.', false);
      setExpanded(null);
    }
  };

  const channelLabel = useMemo(() => {
    const ch = channels.find((c) => c.id === selectedChannel);
    return ch ? ch.name : '';
  }, [channels, selectedChannel]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="eyebrow text-brass text-[11px] mb-3">War Table</div>
      <h1 className="font-display text-4xl md:text-5xl text-bone tracking-[0.08em]">Attendance</h1>
      <p className="text-ash mt-2">Snap a voice channel to log who showed up. Set a title and date, then save.</p>
      <div className="rule-fade my-8" />

      {msg && (
        <div className={`mb-6 px-5 py-3 rounded-sm border text-sm ${msg.ok ? 'border-brass/40 bg-panel text-bone' : 'border-oxblood/50 bg-oxblooddeep/20 text-bone'}`}>{msg.text}</div>
      )}
      {error && <div className="mb-6 px-5 py-3 rounded-sm border border-oxblood/50 bg-oxblooddeep/20 text-bone text-sm">{error}</div>}

      {/* ── Snap section ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <div className="flex-1 min-w-[180px]">
              <label className="eyebrow text-[10px] text-ash block mb-2">Voice channel</label>
              <div className="flex gap-2">
                <select
                  value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}
                  className="flex-1 bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass"
                >
                  <option value="">— select channel —</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.memberCount} in channel)
                    </option>
                  ))}
                </select>
                <button onClick={loadChannels} className="p-2.5 text-ash hover:text-brass" title="Refresh channels">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={snap} disabled={!selectedChannel}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" /> Snap
            </button>
          </div>

          {snapped.length > 0 && (
            <div className="panel rounded-sm p-4">
              <div className="eyebrow text-[10px] text-brass mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Snapped ({snapped.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {snapped.map((m) => (
                  <div key={m.id} className="inline-flex items-center gap-2 bg-hall border border-line rounded-full pl-1.5 pr-2.5 py-1">
                    {m.avatar
                      ? <img src={m.avatar} alt="" className="w-5 h-5 rounded-full border border-line" />
                      : <span className="w-5 h-5 rounded-full bg-panelup border border-line flex items-center justify-center text-[9px] text-brass">{(m.name || '?')[0].toUpperCase()}</span>}
                    <span className="text-sm text-bone">{m.name}</span>
                    <button onClick={() => removeSnapped(m.id)} className="text-ash hover:text-oxblood" title="Remove">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="eyebrow text-[10px] text-ash block mb-2">Event title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Archboss — Morokai"
              className="w-full bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="eyebrow text-[10px] text-ash block mb-2">Event date</label>
            <input
              type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-panel border border-line rounded-sm px-4 py-2.5 text-bone focus:outline-none focus:border-brass"
            />
          </div>
          <button
            onClick={save} disabled={saving || snapped.length === 0}
            className="w-full px-6 py-3 bg-brass hover:bg-brassbright text-ink font-semibold rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : `Save event (${snapped.length} attendees)`}
          </button>
        </div>
      </div>

      {/* ── Past events ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl text-bone tracking-[0.08em]">Past Events</h2>
          <button onClick={loadEvents} className="inline-flex items-center gap-2 text-sm text-ash hover:text-brass">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="rule-fade mb-6" />

        {loadingEvents ? (
          <div className="py-16 text-center text-ash">Reading the rolls…</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-ash">No events logged yet.</div>
        ) : (
          <div className="panel rounded-sm divide-y divide-line">
            {events.map((ev) => {
              const isOpen = expanded === ev.id;
              const attendees = detail[ev.id];
              return (
                <div key={ev.id}>
                  <button
                    onClick={() => toggleEvent(ev.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-panelup transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-bone truncate">{ev.title}</div>
                      <div className="flex items-center gap-3 text-xs text-ash mt-1">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" /> {ev.attendees}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}
                      className="text-ash hover:text-oxblood shrink-0 p-1" title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-ash shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4">
                      {!attendees ? (
                        <div className="py-4 text-center text-ash"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
                      ) : attendees.length === 0 ? (
                        <div className="py-4 text-center text-ash">No attendees recorded.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {attendees.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-1.5 text-sm bg-hall border border-line rounded-full px-3 py-1 text-ash">
                              {a.display_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
