import { useState, useMemo } from 'react';
import FixtureCard from './FixtureCard';

const TABS = [
  { id: 'live', label: 'Live', countKey: 'ongoing' },
  { id: 'upcoming', label: 'Upcoming', countKey: 'upcoming' },
  { id: 'results', label: 'Results', countKey: 'completed' },
];

function getDayKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getDayLabel(dateStr, todayKey, tomorrowKey) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const key = d.getTime();
  if (key === todayKey) return 'Today';
  if (key === tomorrowKey) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupUpcomingByDay(matches) {
  if (!matches?.length) return [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayKey = today.getTime();
  const tomorrowKey = tomorrow.getTime();

  const byDay = new Map();
  for (const m of matches) {
    const at = m.scheduled_at ? new Date(m.scheduled_at) : null;
    const key = at ? getDayKey(at) : 0;
    if (!byDay.has(key)) byDay.set(key, { key, label: at ? getDayLabel(m.scheduled_at, todayKey, tomorrowKey) : 'TBC', date: at, matches: [] });
    byDay.get(key).matches.push(m);
  }
  for (const group of byDay.values()) {
    group.matches.sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return ta - tb;
    });
  }

  const sorted = Array.from(byDay.values()).sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.key - b.key;
  });
  const todayFirst = [];
  const tomorrowSecond = [];
  const rest = [];
  for (const group of sorted) {
    if (group.key === todayKey) todayFirst.push(group);
    else if (group.key === tomorrowKey) tomorrowSecond.push(group);
    else rest.push(group);
  }
  return [...todayFirst, ...tomorrowSecond, ...rest];
}

export default function LandingFixtures({ ongoing, upcoming, completed, loading, error, onRefresh, rounds = [] }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedRoundId, setSelectedRoundId] = useState('all');

  const counts = { ongoing: ongoing?.length ?? 0, upcoming: upcoming?.length ?? 0, completed: completed?.length ?? 0 };
  const getCount = (tab) => counts[tab.countKey] ?? 0;

  const upcomingByDay = useMemo(() => groupUpcomingByDay(upcoming ?? []), [upcoming]);

  const roundOptions = useMemo(() => {
    if (!completed?.length) return [];
    const byId = new Map();
    for (const r of rounds || []) {
      if (r.id) {
        byId.set(r.id, r);
      }
    }
    const seen = new Set();
    const options = [];
    for (const m of completed) {
      if (!m.round_id || seen.has(m.round_id)) continue;
      seen.add(m.round_id);
      const r = byId.get(m.round_id);
      if (r) {
        const label = r.name
          ? `Round ${r.round_number}: ${r.name}`
          : `Round ${r.round_number}`;
        options.push({ id: r.id, order: r.round_number ?? 0, label });
      } else {
        options.push({ id: m.round_id, order: 9999, label: 'Round' });
      }
    }
    options.sort((a, b) => a.order - b.order);
    return options;
  }, [completed, rounds]);

  const getMatches = () => {
    if (activeTab === 'live') return ongoing ?? [];
    if (activeTab === 'upcoming') return upcoming ?? [];
    let list = completed ?? [];
    if (selectedRoundId !== 'all') {
      list = list.filter((m) => m.round_id === selectedRoundId);
    }
    return list.slice(0, 50);
  };

  const matches = getMatches();
  const showResultsCap =
    activeTab === 'results' &&
    (selectedRoundId === 'all'
      ? (completed?.length ?? 0) > 50
      : (completed?.filter((m) => m.round_id === selectedRoundId).length ?? 0) > 50);

  return (
    <div className="rounded-2xl lg:rounded-3xl border border-white/10 bg-mu-navy/80 overflow-hidden">
      {/* Header with title and refresh */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-white/10">
        <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">Fixtures & Results</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs lg:text-sm font-medium text-mu-gold hover:text-amber-400 disabled:opacity-50 transition"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/20">
        {TABS.map((tab) => {
          const n = getCount(tab);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 lg:py-4 px-2 text-center text-sm lg:text-base font-semibold transition
                ${isActive ? 'text-mu-gold border-b-2 border-mu-gold bg-white/5' : 'text-white/60 hover:text-white/90'}
              `}
            >
              {tab.label}
              {n > 0 && (
                <span className={`ml-1.5 text-[10px] lg:text-xs font-bold ${isActive ? 'text-mu-gold/90' : 'text-white/50'}`}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-3 lg:p-6 min-h-[200px]">
        {error && (
          <p className="text-red-400 text-sm py-4 text-center">{error}</p>
        )}
        {loading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/50 text-sm">
            <span className="inline-block w-6 h-6 border-2 border-mu-gold/50 border-t-mu-gold rounded-full animate-spin mb-2" />
            Loading…
          </div>
        )}
        {!loading && activeTab === 'results' && roundOptions.length > 0 && (
          <div className="flex items-center justify-end gap-2 mb-3">
            <label className="text-xs lg:text-sm text-white/60">Round:</label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="bg-mu-navy border border-white/20 text-xs lg:text-sm text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-mu-gold"
            >
              <option value="all">All</option>
              {roundOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {!loading && !error && matches.length === 0 && (
          <div className="py-12 text-center text-white/50 text-sm">
            {activeTab === 'live' && 'No live matches right now.'}
            {activeTab === 'upcoming' && 'No upcoming fixtures.'}
            {activeTab === 'results' && 'No results yet for this round.'}
          </div>
        )}
        {!loading && matches.length > 0 && activeTab !== 'upcoming' && (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {matches.map((m) => (
              <li key={m.id}>
                <FixtureCard match={m} />
              </li>
            ))}
          </ul>
        )}
        {!loading && activeTab === 'upcoming' && upcomingByDay.length > 0 && (
          <div className="space-y-6 lg:space-y-8">
            {upcomingByDay.map((group) => (
              <section key={group.key}>
                <h3 className="text-xs lg:text-sm font-bold text-mu-gold uppercase tracking-wider mb-2 lg:mb-3">
                  {group.label}
                </h3>
                <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {group.matches.map((m) => (
                    <li key={m.id}>
                      <FixtureCard match={m} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        {showResultsCap && (
          <p className="text-white/40 text-xs text-center mt-3">Showing latest 50 results</p>
        )}
      </div>
    </div>
  );
}
