import { useAuth } from '../context/AuthContext';
import { getMe, getMatches } from '../api/client';
import { useState, useEffect, useMemo } from 'react';
import FixtureCard from '../components/FixtureCard';

export default function ParticipantProfile() {
  const { user, verified } = useAuth();
  const [profile, setProfile] = useState(null);
  const [allMatches, setAllMatches] = useState([]);

  useEffect(() => {
    getMe().then(setProfile).catch(() => setProfile(null));
  }, [user]);

  useEffect(() => {
    getMatches().then((r) => setAllMatches(r.matches || [])).catch(() => setAllMatches([]));
  }, [user]);

  const participant = profile?.participant || null;
  const isParticipant = !!participant;
  const isEliminated = !!participant?.eliminated;
  const myMatches = useMemo(() => {
    if (!user?.id) return { upcoming: [], ongoing: [], past: [] };
    const uid = user.id;
    const list = allMatches.filter(
      (m) => m.home_participant_user_id === uid || m.away_participant_user_id === uid
    );
    return {
      upcoming: list.filter((m) => m.status === 'scheduled'),
      ongoing: list.filter((m) => m.status === 'ongoing'),
      past: list.filter((m) => m.status === 'completed'),
    };
  }, [user?.id, allMatches]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-mu-gold">My profile</h1>
        <p className="text-white/60 text-sm">Your tournament identity and participation status.</p>
      </div>

      <div className="bg-mu-blue rounded-2xl border border-mu-gold/30 p-6 flex gap-4 items-center">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-mu-gold/30 flex items-center justify-center text-mu-gold text-2xl font-bold">
            {user.full_name?.charAt(0)}
          </div>
        )}
        <div className="space-y-1">
          <p className="text-white font-semibold leading-tight">{user.full_name}</p>
          <p className="text-white/70 text-sm">@{user.efootball_username}</p>
          <p className="text-white/60 text-xs">
            Role: <span className="font-medium text-white">{user.role}</span>
          </p>
        </div>
      </div>

      {!isParticipant && (
        <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-sm space-y-1">
          <p className="font-semibold">You are on the waiting list.</p>
          <p>
            Once your payment is verified and you are added as a participant, your fixtures and results will appear
            here.
          </p>
        </div>
      )}

      {isParticipant && !isEliminated && (
        <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/50 text-green-200 text-sm space-y-1">
          <p className="font-semibold">You are in the arena.</p>
          <p>
            Every fixture you play shapes the bracket, your reputation, and who dares to face you next. Stay ready —
            your next kick-off could be the one everyone remembers.
          </p>
        </div>
      )}

      {isParticipant && isEliminated && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-400/60 text-red-200 text-sm space-y-1">
          <p className="font-semibold">You have been eliminated from the tournament.</p>
          <p>
            You will not receive any more fixtures, but you can still view your past results below.
          </p>
        </div>
      )}

      {isParticipant &&
        (myMatches.upcoming.length > 0 || myMatches.ongoing.length > 0 || myMatches.past.length > 0) && (
        <>
          {myMatches.ongoing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-white font-semibold text-sm">My ongoing matches</h2>
              <div className="space-y-3">
                {myMatches.ongoing.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
          {myMatches.upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-white font-semibold text-sm">My upcoming matches</h2>
              <div className="space-y-3">
                {myMatches.upcoming.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
          {myMatches.past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-white font-semibold text-sm">My past results</h2>
              <div className="space-y-3">
                {myMatches.past.map((m) => (
                  <FixtureCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {isParticipant &&
        !myMatches.upcoming?.length &&
        !myMatches.ongoing?.length &&
        !myMatches.past?.length && (
        <section className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm">Your matches</h2>
          {!isEliminated ? (
            <p className="text-white/60 text-sm">
              Once the bracket is seeded and you are fixed into fixtures, your upcoming and past matches will appear
              here.
            </p>
          ) : (
            <p className="text-white/60 text-sm">
              You have been eliminated and do not have any recorded fixtures or results in this tournament.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
