import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const [efootball_username, setEfootball_username] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const username = efootball_username.trim();
    if (username.length < 3) {
      setError('eFootball username should be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token);
      loginSuccess(data.user, data.verified);
      if (data.user.role === 'super_admin') navigate('/super-admin', { replace: true });
      else if (data.user.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mu-navy text-white max-w-lg mx-auto px-4 py-8">
      <Link to="/" className="text-mu-gold text-sm mb-6 inline-block">
        ← Back
      </Link>
      <h1 className="text-xl font-bold text-mu-gold mb-6">Log in</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-white/80 mb-1">eFootball username</label>
          <input
            type="text"
            required
            value={efootball_username}
            onChange={(e) => setEfootball_username(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
            placeholder="Your in-game username"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-16 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs text-white/70"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-mu-gold text-mu-navy font-bold disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-white/60 text-sm mt-6">
        No account? <Link to="/register" className="text-mu-gold">Register</Link>
      </p>
    </div>
  );
}
