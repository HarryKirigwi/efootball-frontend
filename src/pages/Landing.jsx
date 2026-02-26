import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConfig, getRounds } from '../api/client';
import { useMatches } from '../hooks/useMatches';
import LandingFixtures from '../components/LandingFixtures';

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.73.966-.894 1.164-.163.199-.326.223-.604.075-.277-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.172-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.178-.008-.371-.01-.565-.01-.194 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [config, setConfig] = useState({ tournament_status: 'not_started', tournament_name: '' });
  const [rounds, setRounds] = useState([]);
  const { upcoming, ongoing, completed, loading, error, refetch } = useMatches();
  useEffect(() => {
    getConfig().then(setConfig).catch(() => ({}));
  }, []);
  useEffect(() => {
    getRounds().then((r) => setRounds(r.rounds || [])).catch(() => setRounds([]));
  }, []);
  const started = config.tournament_status === 'started';

  return (
    <div className="min-h-screen bg-mu-navy text-white flex flex-col overflow-x-hidden">
      {/* Top-right login when not logged in – mobile/tablet only; desktop uses top bar */}
      {!user && (
        <div className="fixed top-4 right-4 md:right-6 md:top-5 z-40 lg:hidden">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-mu-blue border border-mu-gold/40 text-sm font-medium text-white shadow-lg hover:bg-mu-gold hover:text-mu-navy transition"
          >
            Log in
          </Link>
        </div>
      )}

      {/* Top bar (logo + title, and on desktop: Log in / Reserve spot when registration is on) */}
      <header className={`sticky top-0 z-30 border-b border-white/10 bg-mu-navy/95 backdrop-blur-sm ${!user ? 'pr-24 md:pr-28 lg:pr-0' : ''}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 md:py-3 lg:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full overflow-hidden flex-shrink-0">
              <img src="/favicon.png" alt="Machakos University" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-bold text-mu-gold text-base md:text-lg lg:text-xl truncate min-w-0">MKSU Efootball Tournament</h1>
          </div>
          {/* Desktop: Log in and/or Reserve spot in top bar when not logged in */}
          {!user && (
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {!started && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl bg-mu-blue border border-mu-gold/40 text-sm font-medium text-white hover:bg-mu-gold hover:text-mu-navy transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy font-bold text-sm hover:opacity-90 transition"
                  >
                    Reserve spot
                  </Link>
                </>
              )}
              {started && (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-mu-blue border border-mu-gold/40 text-sm font-medium text-white hover:bg-mu-gold hover:text-mu-navy transition"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="w-full max-w-lg lg:max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex-1 pb-32 md:pb-12 pt-2 md:pt-4 lg:pt-6">
        {/* Sponsored line below top bar */}
        <p className="text-white/60 text-xs lg:text-sm text-center mb-4 lg:mb-6">Sponsored by Migichi Adventures</p>

        {/* Welcome + registration only when tournament has not started */}
        {!started && (
          <>
            {/* Hero: welcome + rules – single column on mobile, two columns on lg+ */}
            <section className="bg-mu-blue/50 rounded-2xl border border-mu-gold/30 p-6 md:p-8 lg:p-10 mb-6 lg:mb-8">
              <div className="lg:grid lg:grid-cols-5 lg:gap-8">
                <div className="lg:col-span-3">
                  <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-4">
                    <span className="text-mu-gold font-semibold">Migichi Adventures</span> welcomes you to an eFootball tournament scheduled to take place from <strong className="text-white">2 March</strong>.
                  </p>
                  <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-4">
                    The tournament will feature <strong className="text-white">up to 128 participants</strong> and will run in rounds until we reach the finals. Compete, advance, and aim for the top.
                  </p>
                  <div className="rounded-xl bg-mu-navy/60 border border-mu-gold/20 p-4 lg:p-5 mt-4">
                    <p className="text-mu-gold font-semibold text-sm lg:text-base mb-2">Prizes</p>
                    <p className="text-white/90 text-sm lg:text-base">Winner: <strong className="text-mu-gold">KSH 5,000</strong></p>
                    <p className="text-white/90 text-sm lg:text-base">2nd place (runner-up): <strong className="text-mu-gold">KSH 2,000</strong></p>
                  </div>
                </div>
                <div className="lg:col-span-2 mt-6 lg:mt-0">
                  <p className="text-mu-gold font-semibold text-sm lg:text-base mt-0 mb-2">Rules</p>
                  <ol className="text-white/90 text-sm lg:text-base space-y-1.5 lg:space-y-2 list-decimal list-inside">
                    <li>Smart assist will be off</li>
                    <li>Participants should ensure they have their own data bundles.</li>
                    <li>Participants to show up during their matchdays at the given venue and on time.</li>
                    <li>No trash talking – this will subject you to elimination.</li>
                    <li>No rematch – we accept the outcomes.</li>
                  </ol>
                  <p className="text-white/70 text-xs lg:text-sm mt-4">
                    For queries, use the WhatsApp and TikTok icons at the bottom right.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6 lg:mb-8">
              <p className="text-white/80 text-sm lg:text-base text-center mb-4 lg:mb-0">
                Entry fee: KSH 90 to be paid on match day · Slots are limited and may close once the draw is full.
              </p>
              {/* Mobile/tablet only: Log in + Reserve spot; on desktop they are in the top bar */}
              {!user && (
                <div className="grid grid-cols-2 lg:hidden gap-3 max-w-md mx-auto mt-4">
                  <Link
                    to="/login"
                    className="py-3 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="py-3 rounded-xl bg-mu-gold text-mu-navy font-bold text-center text-sm"
                  >
                    Reserve spot
                  </Link>
                </div>
              )}
            </section>
          </>
        )}

        {/* Rules when live – just before fixtures */}
        {started && (
          <section className="rounded-xl border border-white/10 bg-mu-navy/60 p-4 lg:p-6 mb-4 lg:mb-6">
            <h2 className="text-xs lg:text-sm font-bold text-mu-gold uppercase tracking-wider mb-3">Rules</h2>
            <ol className="text-white/90 text-sm lg:text-base space-y-1.5 lg:space-y-2 list-decimal list-inside">
              <li>Smart assist will be off</li>
              <li>Participants should ensure they have their own data bundles.</li>
              <li>Participants to show up during their matchdays at the given venue and on time.</li>
              <li>No trash talking – this will subject you to elimination.</li>
              <li>No rematch – we accept the outcomes.</li>
            </ol>
          </section>
        )}

        {/* Fixtures / results only when tournament is live */}
        {started && (
          <div className="mb-6 lg:mb-8">
            <LandingFixtures
              ongoing={ongoing}
              upcoming={upcoming}
              completed={completed}
              loading={loading}
              error={error}
              onRefresh={refetch}
              rounds={rounds}
            />
          </div>
        )}

        {/* Logged-in: profile and admin links */}
        {user && (
          <div className="flex flex-col lg:flex-row gap-3 lg:justify-center">
            <Link
              to="/profile"
              className="block py-3 lg:py-3.5 lg:px-8 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium lg:text-base"
            >
              My profile
            </Link>
            {user.role === 'super_admin' && (
              <Link
                to="/super-admin"
                className="block py-3 lg:py-3.5 lg:px-8 rounded-xl bg-mu-gold/20 border border-mu-gold text-mu-gold text-center font-medium lg:text-base"
              >
                Super Admin
              </Link>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 lg:py-6 px-4 sm:px-6 md:px-8 lg:px-10 pb-24 md:pb-4 text-center max-w-5xl mx-auto">
        <p className="text-white/70 text-sm lg:text-base">
          <a
            href="https://wa.me/254705483375"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-mu-gold transition"
          >
            Powered by Phaetex Solutions
          </a>
        </p>
      </footer>

      {/* Enquiry icons – bottom right (pb-24 clears on mobile) */}
      <div className="fixed bottom-20 right-4 md:right-6 md:bottom-6 lg:right-10 lg:bottom-8 flex flex-col gap-2 z-50">
        <a
          href="https://wa.me/254703977461"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition"
          aria-label="WhatsApp enquiries"
        >
          <WhatsAppIcon className="w-6 h-6 lg:w-7 lg:h-7" />
        </a>
        <a
          href="https://www.tiktok.com/@migichi_wanders?is_from_webapp=1&sender_device=pc"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black flex items-center justify-center text-white shadow-lg hover:opacity-90 transition"
          aria-label="TikTok enquiries"
        >
          <TikTokIcon className="w-5 h-5 lg:w-6 lg:h-6" />
        </a>
      </div>
    </div>
  );
}
