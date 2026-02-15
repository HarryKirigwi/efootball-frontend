import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/client';
import { useState, useEffect } from 'react';

export default function ParticipantProfile() {
  const { user, verified } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMe().then(setProfile).catch(() => setProfile(null));
  }, [user]);

  if (!user) return null;

  const participant = profile?.participant || null;

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

      {verified ? (
        <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/50 text-green-200 text-sm space-y-1">
          <p className="font-semibold">You are verified and on the participants list.</p>
          <p>
            You will be fixed into the bracket once the tournament starts. Your performance will determine who you face
            in later rounds.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-sm space-y-1">
          <p className="font-semibold">You have been added to the waiting list.</p>
          <p>
            You will be paired once the tournament starts. Stay tuned for match announcements.
          </p>
        </div>
      )}

      <section className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm">Tournament stats (coming soon)</h2>
        <p className="text-white/60 text-sm">
          Once the tournament starts, this section will show each match you play with its score and match stats (such as
          pass accuracy and possession) for that specific game.
        </p>
      </section>
    </div>
  );
}
