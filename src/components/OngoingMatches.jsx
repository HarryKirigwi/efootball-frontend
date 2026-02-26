import MatchCard from './MatchCard';

export default function OngoingMatches({ matches }) {
  if (!matches?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-mu-gold">Ongoing</h2>
      <ul className="space-y-3">
        {matches.map((m) => (
          <li key={m.id}>
            <MatchCard match={m} variant="ongoing" />
          </li>
        ))}
      </ul>
    </section>
  );
}
