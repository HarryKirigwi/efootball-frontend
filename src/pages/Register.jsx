import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    efootball_username: '',
    password: '',
    confirmPassword: '',
    mpesa_transaction_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullName = form.full_name.trim();
    const username = form.efootball_username.trim();
    const mpesaCode = form.mpesa_transaction_code.trim().toUpperCase();

    if (fullName.length < 3) {
      setError('Full name should be at least 3 characters.');
      return;
    }
    if (username.length < 3) {
      setError('eFootball username should be at least 3 characters.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^[A-Z0-9]{10}$/.test(mpesaCode)) {
      setError('M-Pesa transaction code should be 10 characters, letters and numbers only (e.g. UBAJ96AZLW).');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister({
        full_name: fullName,
        efootball_username: username,
        password: form.password,
        mpesa_transaction_code: mpesaCode,
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/profile', { replace: true });
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mu-navy text-white max-w-lg mx-auto px-4 py-8">
      <Link to="/" className="text-mu-gold text-sm mb-6 inline-block">
        Back
      </Link>
      <h1 className="text-xl font-bold text-mu-gold mb-2">Register</h1>
      <p className="text-white/70 text-sm mb-6">
        Pay KSH 90 via M-Pesa and paste your transaction code. You will be added to the participants list after
        verification.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-white/80 mb-1">Full name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
            placeholder="e.g. John Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">eFootball username</label>
          <input
            type="text"
            required
            value={form.efootball_username}
            onChange={(e) => setForm((f) => ({ ...f, efootball_username: e.target.value }))}
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
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
        <div>
          <label className="block text-sm text-white/80 mb-1">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 pr-16 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
              placeholder="Repeat password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs text-white/70"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">M-Pesa transaction code</label>
          <input
            type="text"
            required
            value={form.mpesa_transaction_code}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                mpesa_transaction_code: e.target.value.toUpperCase(),
              }))
            }
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
            placeholder="e.g. UBAJ96AZLW"
            maxLength={10}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-mu-gold text-mu-navy font-bold disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center text-white/60 text-sm mt-6">
        Already have an account? <Link to="/login" className="text-mu-gold">Log in</Link>
      </p>
    </div>
  );
}
