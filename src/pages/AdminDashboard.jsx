import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMatches,
  startMatch,
  addMatchEvent,
  endMatch,
} from '../api/client';
import MatchCard from '../components/MatchCard';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [endForm, setEndForm] = useState(null);

  const load = () => {
    setLoading(true);
    getMatches()
      .then((r) => setMatches(r.matches || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (id) => {
    setError('');
    setActing(id);
    try {
      await startMatch(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleGoal = async (id, eventType, minute) => {
    setError('');
    setActing(id);
    try {
      await addMatchEvent(id, { event_type: eventType, minute: minute || null });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const handleEnd = async (id) => {
    const form = endForm;
    if (!form || form.matchId !== id) return;
    setError('');
    setActing(id);
    try {
      await endMatch(id, {
        home_goals: form.home_goals ?? 0,
        away_goals: form.away_goals ?? 0,
        home_pass_accuracy: form.home_pass_accuracy ?? null,
        away_pass_accuracy: form.away_pass_accuracy ?? null,
        home_possession: form.home_possession ?? null,
        away_possession: form.away_possession ?? null,
      });
      setEndForm(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(null);
    }
  };

  const scheduled = matches.filter((m) => m.status === 'scheduled');
  const ongoing = matches.filter((m) => m.status === 'ongoing');
  const completed = matches.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-mu-gold">Admin dashboard</h1>
          <p className="text-white/60 text-sm">
            Welcome, {user?.full_name}. Start matches, record goals, and end games with final stats.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm border border-white/10 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/60">Loading matches…</p>
      ) : (
        <>
          {ongoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-mu-gold">Ongoing</h2>
              {ongoing.map((m) => (
                <div key={m.id} className="bg-mu-blue rounded-2xl border border-mu-gold/30 p-4 space-y-3">
                  <MatchCard match={m} variant="ongoing" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleGoal(m.id, 'goal_home', null)}
                      disabled={acting === m.id}
                      className="px-3 py-1.5 rounded-lg bg-mu-gold/20 text-mu-gold text-sm border border-mu-gold/50 disabled:opacity-50"
                    >
                      Goal Home
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGoal(m.id, 'goal_away', null)}
                      disabled={acting === m.id}
                      className="px-3 py-1.5 rounded-lg bg-mu-gold/20 text-mu-gold text-sm border border-mu-gold/50 disabled:opacity-50"
                    >
                      Goal Away
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndForm({ matchId: m.id, home_goals: m.home_goals ?? 0, away_goals: m.away_goals ?? 0, home_pass_accuracy: '', away_pass_accuracy: '', home_possession: '', away_possession: '' })}
                      disabled={acting === m.id}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-400/40 disabled:opacity-50"
                    >
                      End game
                    </button>
                  </div>
                  {endForm?.matchId === m.id && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <input
                        type="number"
                        min="0"
                        placeholder="Home goals"
                        value={endForm.home_goals}
                        onChange={(e) => setEndForm((f) => ({ ...f, home_goals: Number(e.target.value) || 0 }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Away goals"
                        value={endForm.away_goals}
                        onChange={(e) => setEndForm((f) => ({ ...f, away_goals: Number(e.target.value) || 0 }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Home pass %"
                        value={endForm.home_pass_accuracy === '' ? '' : endForm.home_pass_accuracy}
                        onChange={(e) => setEndForm((f) => ({ ...f, home_pass_accuracy: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Away pass %"
                        value={endForm.away_pass_accuracy === '' ? '' : endForm.away_pass_accuracy}
                        onChange={(e) => setEndForm((f) => ({ ...f, away_pass_accuracy: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Home possession %"
                        value={endForm.home_possession === '' ? '' : endForm.home_possession}
                        onChange={(e) => setEndForm((f) => ({ ...f, home_possession: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Away possession %"
                        value={endForm.away_possession === '' ? '' : endForm.away_possession}
                        onChange={(e) => setEndForm((f) => ({ ...f, away_possession: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="px-3 py-2 rounded-lg bg-mu-navy border border-white/10 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleEnd(m.id)}
                        disabled={acting === m.id}
                        className="col-span-2 py-2 rounded-lg bg-mu-gold text-mu-navy font-semibold text-sm disabled:opacity-50"
                      >
                        Submit result
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndForm(null)}
                        className="col-span-2 py-2 rounded-lg bg-white/10 text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {scheduled.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white/80">Scheduled</h2>
              {scheduled.map((m) => (
                <div key={m.id} className="bg-mu-blue rounded-2xl border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
                  <MatchCard match={m} />
                  <button
                    type="button"
                    onClick={() => handleStart(m.id)}
                    disabled={acting === m.id}
                    className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy font-semibold text-sm disabled:opacity-50"
                  >
                    {acting === m.id ? 'Starting…' : 'Start game'}
                  </button>
                </div>
              ))}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white/80">Completed</h2>
              {completed.slice(0, 10).map((m) => (
                <div key={m.id}>
                  <MatchCard match={m} variant="completed" />
                </div>
              ))}
            </section>
          )}

          {!loading && matches.length === 0 && (
            <p className="text-white/60 text-sm">No matches yet. Super admin can seed the bracket from the Super Admin panel.</p>
          )}
        </>
      )}
    </div>
  );
}
