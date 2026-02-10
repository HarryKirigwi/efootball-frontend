import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-mu-gold">Admin dashboard</h1>
        <p className="text-white/60 text-sm">
          Welcome, {user?.full_name}. This is your control room for managing matches during the tournament.
        </p>
      </div>

      <section className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm">Today&apos;s responsibilities</h2>
        <ul className="list-disc list-inside text-white/70 text-sm space-y-1">
          <li>Start matches on time and mark them as ongoing.</li>
          <li>Update scores and stats (goals, possession, pass accuracy) in real time.</li>
          <li>End matches when they finish and submit final stats.</li>
        </ul>
        <p className="text-white/50 text-xs mt-1">
          Match assignment and in-game controls will appear here once the tournament schedule is live.
        </p>
      </section>

      <section className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm">What you&apos;ll see here later</h2>
        <div className="space-y-2 text-white/70 text-sm">
          <p>Once fixtures are generated, this dashboard will show:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>A list of matches you&apos;re managing.</li>
            <li>Kick-off times and assigned participants.</li>
            <li>Controls to start, pause, update scores, and end each match.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
