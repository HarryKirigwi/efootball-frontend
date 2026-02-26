export default function MatchCard({ match, variant = 'default' }) {
  const scheduled = match.scheduled_at ? new Date(match.scheduled_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '';
  const isLive = match.status === 'ongoing';

  return (
    <div className={`rounded-2xl border p-4 ${variant === 'ongoing' ? 'border-mu-gold/60 bg-mu-gold/10' : 'border-white/10 bg-mu-blue/50'}`}>
      <div className="flex items-center justify-between gap-2 text-white/60 text-xs mb-2">
        <span>{scheduled}</span>
        {isLive && <span className="text-mu-gold font-semibold animate-pulse">LIVE</span>}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-right">
          <p className="font-medium text-white truncate">{match.home_name || 'TBD'}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-lg font-bold text-white tabular-nums">{match.home_goals ?? 0}</span>
          <span className="text-white/50">–</span>
          <span className="text-lg font-bold text-white tabular-nums">{match.away_goals ?? 0}</span>
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-medium text-white truncate">{match.away_name || 'TBD'}</p>
        </div>
      </div>
      {match.status === 'completed' && (match.home_pass_accuracy != null || match.away_possession != null) && (
        <p className="text-white/50 text-xs mt-2">
          Pass accuracy / Possession: {match.home_pass_accuracy ?? '-'}% / {match.home_possession ?? '-'}% – {match.away_pass_accuracy ?? '-'}% / {match.away_possession ?? '-'}%
        </p>
      )}
    </div>
  );
}
