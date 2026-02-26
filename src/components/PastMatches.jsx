import MatchCard from './MatchCard';

export default function PastMatches({ matches }) {
  if (!matches?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white/80">Past</h2>
      <ul className="space-y-3">
        {matches.slice(0, 20).map((m) => (
          <li key={m.id}>
            <MatchCard match={m} variant="completed" />
          </li>
        ))}
      </ul>
      {matches.length > 20 && (
        <p className="text-white/50 text-sm">Showing latest 20 of {matches.length} matches.</p>
      )}
    </section>
  );
}
