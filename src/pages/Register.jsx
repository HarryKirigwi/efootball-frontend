import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    reg_no: '',
    efootball_username: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullName = form.full_name.trim();
    const regNo = form.reg_no.trim();
    const username = form.efootball_username.trim();
    const phone = form.phone_number.trim();

    if (fullName.length < 3) {
      setError('Full name should be at least 3 characters.');
      return;
    }
    if (regNo.length < 3) {
      setError('Registration number should be at least 3 characters.');
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
    const phoneDigits = phone.replace(/\D/g, '');
    const validPhone =
      (phoneDigits.startsWith('254') && phoneDigits.length === 12) ||
      (phoneDigits.startsWith('0') && phoneDigits.length === 10) ||
      (phoneDigits.length === 9 && /^[17]/.test(phoneDigits));
    if (!validPhone) {
      setError('Enter a valid Kenyan phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX).');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister({
        full_name: fullName,
        reg_no: regNo,
        efootball_username: username,
        password: form.password,
        phone_number: phone,
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) loginSuccess(data.user, data.verified);
        navigate('/profile', { replace: true });
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
        Enter your phone number to reserve your spot. You will be added to the participants list after verification.
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
            placeholder="e.g. Cliff Odero"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">Admission number</label>
          <input
            type="text"
            required
            value={form.reg_no}
            onChange={(e) => setForm((f) => ({ ...f, reg_no: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
            placeholder="e.g. J17-0458-2025"
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
          <label className="block text-sm text-white/80 mb-1">Phone number</label>
          <input
            type="tel"
            required
            value={form.phone_number}
            onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/20 text-white placeholder-white/40 focus:border-mu-gold outline-none"
            placeholder="e.g. 0712345678 or 254712345678"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-mu-gold text-mu-navy font-bold disabled:opacity-50"
        >
          {loading ? 'Reserving...' : 'Reserve spot'}
        </button>
      </form>
      <p className="text-center text-white/60 text-sm mt-6">
        Already have an account? <Link to="/login" className="text-mu-gold">Log in</Link>
      </p>
    </div>
  );
}
