/**
 * Betting-app style fixture card: team names, score or time, status pill.
 */
export default function FixtureCard({ match }) {
  const scheduled = match.scheduled_at
    ? new Date(match.scheduled_at).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBC';
  const isLive = match.status === 'ongoing';
  const isCompleted = match.status === 'completed';
  const showScore = isLive || isCompleted;
  const homeName = match.home_name || 'TBD';
  const awayName = match.away_name || 'TBD';

  return (
    <div
      className={`
        rounded-xl lg:rounded-2xl border overflow-hidden
        ${isLive ? 'border-amber-500/60 bg-amber-500/5 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]' : 'border-white/10 bg-white/[0.04]'}
      `}
    >
      {/* Top bar: time/date + status pill */}
      <div className="flex items-center justify-between gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border-b border-white/5">
        <span className="text-[11px] lg:text-xs uppercase tracking-wider text-white/50">{scheduled}</span>
        {match.venue && (
          <span className="text-[11px] lg:text-xs text-white/40 truncate max-w-[120px] lg:max-w-[160px]" title={match.venue}>
            {match.venue}
          </span>
        )}
        <span
          className={`
            shrink-0 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wider
            ${isLive ? 'bg-amber-500/20 text-amber-400 animate-pulse' : ''}
            ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : ''}
            ${match.status === 'scheduled' || match.status === 'upcoming' ? 'bg-white/10 text-white/70' : ''}
          `}
        >
          {isLive ? 'Live' : isCompleted ? 'FT' : 'Upcoming'}
        </span>
      </div>

      {/* Main row: Home | Score/Time | Away */}
      <div className="flex items-stretch min-h-[72px] lg:min-h-[80px]">
        {/* Home team */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-3 lg:px-4 py-3 lg:py-4 text-right">
          <p className="font-semibold text-white truncate text-sm lg:text-base leading-tight">{homeName}</p>
          {isCompleted && match.home_possession != null && (
            <p className="text-[10px] lg:text-xs text-white/40 mt-0.5">Poss: {match.home_possession}%</p>
          )}
        </div>

        {/* Score or time */}
        <div className="shrink-0 w-20 lg:w-24 flex flex-col items-center justify-center border-x border-white/5 bg-white/[0.02]">
          {showScore ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-bold tabular-nums text-white">
                  {match.home_goals ?? 0}
                </span>
                <span className="text-white/30 font-medium">–</span>
                <span className="text-2xl lg:text-3xl font-bold tabular-nums text-white">
                  {match.away_goals ?? 0}
                </span>
              </div>
              {isLive && (
                <span className="text-[10px] lg:text-xs text-amber-400/90 font-medium mt-0.5">Live</span>
              )}
            </>
          ) : (
            <span className="text-xs lg:text-sm font-medium text-white/60">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-3 lg:px-4 py-3 lg:py-4 text-left">
          <p className="font-semibold text-white truncate text-sm lg:text-base leading-tight">{awayName}</p>
          {isCompleted && match.away_possession != null && (
            <p className="text-[10px] lg:text-xs text-white/40 mt-0.5">Poss: {match.away_possession}%</p>
          )}
        </div>
      </div>

      {/* Optional: extra stats for completed */}
      {isCompleted && (match.home_pass_accuracy != null || match.away_pass_accuracy != null) && (
        <div className="px-3 lg:px-4 py-2 lg:py-2.5 border-t border-white/5 flex justify-between text-[10px] lg:text-xs text-white/40">
          <span>Pass: {match.home_pass_accuracy ?? '-'}%</span>
          <span>Pass: {match.away_pass_accuracy ?? '-'}%</span>
        </div>
      )}
    </div>
  );
}
