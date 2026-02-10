import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-mu-navy">
      <header className="sticky top-0 z-10 bg-mu-blue/95 backdrop-blur border-b border-mu-gold/20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-mu-gold font-bold text-sm truncate">
            MU Efootball
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs truncate max-w-[120px]">{user?.full_name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
