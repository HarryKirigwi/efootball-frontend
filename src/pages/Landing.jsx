import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConfig } from '../api/client';

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
  useEffect(() => {
    getConfig().then(setConfig).catch(() => ({}));
  }, []);
  const started = config.tournament_status === 'started';
  const name = config.tournament_name || 'Machakos University Efootball Tournament';

  return (
    <div className="min-h-screen bg-mu-navy text-white flex flex-col">
      <div className="max-w-lg mx-auto px-4 py-8 pb-32 flex-1">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-mu-gold mb-1">{name}</h1>
          <p className="text-white/70 text-sm">Sponsored by Migichi Adventures</p>
        </div>

        {/* Welcome block */}
        <section className="bg-mu-blue/50 rounded-2xl border border-mu-gold/30 p-6 mb-6">
          <p className="text-white/90 text-sm leading-relaxed mb-4">
            <span className="text-mu-gold font-semibold">Migichi Adventures</span> welcomes you to an eFootball tournament scheduled to take place from <strong className="text-white">2 March</strong>.
          </p>
          <p className="text-white/90 text-sm leading-relaxed mb-4">
            The tournament will feature <strong className="text-white">128 participants</strong> at the start and will run in rounds until we reach the finals. Compete, advance, and aim for the top.
          </p>
          <div className="rounded-xl bg-mu-navy/60 border border-mu-gold/20 p-4 mt-4">
            <p className="text-mu-gold font-semibold text-sm mb-2">Prizes</p>
            <p className="text-white/90 text-sm">Winner: <strong className="text-mu-gold">KSH 5,000</strong></p>
            <p className="text-white/90 text-sm">2nd place (runner-up): <strong className="text-mu-gold">KSH 2,000</strong></p>
          </div>
        </section>

        {!started ? (
          <section className="mb-6">
            <p className="text-white/80 text-sm text-center mb-4">Entry fee: KSH 90 · Limited to the first 128 players.</p>
            {!user && (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="py-3 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium text-sm">Log in</Link>
                <Link to="/register" className="py-3 rounded-xl bg-mu-gold text-mu-navy font-bold text-center text-sm">Register</Link>
              </div>
            )}
          </section>
        ) : (
          <div className="bg-mu-blue/50 rounded-2xl border border-mu-gold/30 p-6 mb-6">
            <p className="text-mu-gold font-semibold text-center mb-2">Tournament is live</p>
            <p className="text-white/80 text-sm text-center">Upcoming, ongoing and past matches will appear here.</p>
          </div>
        )}

        {/* Logged-in: profile and admin links */}
        {user && (
          <div className="flex flex-col gap-3">
            <Link to="/profile" className="block py-3 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium">My profile</Link>
            {user.role === 'super_admin' && <Link to="/super-admin" className="block py-3 rounded-xl bg-mu-gold/20 border border-mu-gold text-mu-gold text-center font-medium">Super Admin</Link>}
            {(user.role === 'admin' || user.role === 'super_admin') && <Link to="/admin" className="block py-3 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium">Admin</Link>}
          </div>
        )}

        {/* Guest: side-by-side Login / Register (when tournament is live) */}
        {!user && started && (
          <div className="grid grid-cols-2 gap-3">
            <Link to="/login" className="py-3 rounded-xl bg-mu-blue border border-mu-gold/30 text-center font-medium text-sm">Log in</Link>
            <Link to="/register" className="py-3 rounded-xl border border-mu-gold/50 text-mu-gold text-center font-medium text-sm">Register</Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-4 text-center">
        <p className="text-white/50 text-xs">Powered by Phaetex Solutions</p>
      </footer>

      {/* Enquiry icons – bottom right */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50">
        <a
          href="https://wa.me/254703977461"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition"
          aria-label="WhatsApp enquiries"
        >
          <WhatsAppIcon className="w-6 h-6" />
        </a>
        <a
          href="https://www.tiktok.com/@migichi_wanders?is_from_webapp=1&sender_device=pc"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shadow-lg hover:opacity-90 transition"
          aria-label="TikTok enquiries"
        >
          <TikTokIcon className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
