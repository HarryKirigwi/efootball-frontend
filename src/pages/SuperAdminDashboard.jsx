import { useMemo, useState, useEffect } from 'react';
import { createAdmin, getPendingPayments, getUsersList, verifyPayment } from '../api/client';

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-mu-blue rounded-2xl border border-mu-gold/20 p-4">
      <p className="text-white/70 text-xs">{label}</p>
      <p className="text-mu-gold text-xl font-bold mt-1">{value}</p>
      {hint ? <p className="text-white/60 text-xs mt-1">{hint}</p> : null}
    </div>
  );
}

function Badge({ tone = 'neutral', children }) {
  const cls =
    tone === 'success'
      ? 'bg-green-500/20 text-green-200 border-green-400/40'
      : tone === 'warning'
        ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
        : tone === 'danger'
          ? 'bg-red-500/20 text-red-200 border-red-400/40'
          : 'bg-white/10 text-white/70 border-white/10';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${cls}`}>{children}</span>;
}

export default function SuperAdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('payments');
  const [adminForm, setAdminForm] = useState({ full_name: '', efootball_username: '', password: '' });
  const [paymentsQuery, setPaymentsQuery] = useState('');
  const [usersQuery, setUsersQuery] = useState('');

  const load = () => {
    setLoading(true);
    getPendingPayments().then((r) => setPayments(r.payments || [])).catch(() => setPayments([])).finally(() => setLoading(false));
    getUsersList().then((r) => setUsers(r.users || [])).catch(() => setUsers([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (id, action) => {
    setError('');
    try {
      await verifyPayment(id, action);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    if (!adminForm.full_name?.trim() || !adminForm.efootball_username?.trim() || !adminForm.password) {
      setError('Fill all fields');
      return;
    }
    if (adminForm.password.length < 6) {
      setError('Password at least 6 characters');
      return;
    }
    try {
      await createAdmin(adminForm);
      setAdminForm({ full_name: '', efootball_username: '', password: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const derived = useMemo(() => {
    const totalUsers = users.length;
    const adminAccounts = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
    const verifiedParticipants = users.filter((u) => u.is_participant).length;
    const pendingPayments = payments.length;
    return { totalUsers, adminAccounts, verifiedParticipants, pendingPayments };
  }, [payments.length, users]);

  const filteredPayments = useMemo(() => {
    const q = paymentsQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      `${p.full_name} ${p.efootball_username} ${p.mpesa_transaction_code || ''} ${p.phone_number || ''}`.toLowerCase().includes(q)
    );
  }, [payments, paymentsQuery]);

  const filteredUsers = useMemo(() => {
    const q = usersQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.full_name} ${u.efootball_username} ${u.role}`.toLowerCase().includes(q));
  }, [users, usersQuery]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-mu-gold">Super Admin</h1>
          <p className="text-white/60 text-sm">Verify payments, create admins, and track registrations.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm border border-white/10"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pending payments" value={derived.pendingPayments} hint="Awaiting verification" />
        <StatCard label="Verified participants" value={derived.verifiedParticipants} hint="Eligible for pairing" />
        <StatCard label="Admin accounts" value={derived.adminAccounts} hint="Admins + Super Admin" />
        <StatCard label="Total users" value={derived.totalUsers} hint="All registered accounts" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setTab('payments')}
          className={`px-3 py-2 rounded-xl text-sm border ${
            tab === 'payments' ? 'bg-mu-gold text-mu-navy border-mu-gold' : 'bg-mu-blue text-white border-white/10'
          }`}
        >
          Payments
        </button>
        <button
          type="button"
          onClick={() => setTab('admins')}
          className={`px-3 py-2 rounded-xl text-sm border ${
            tab === 'admins' ? 'bg-mu-gold text-mu-navy border-mu-gold' : 'bg-mu-blue text-white border-white/10'
          }`}
        >
          Create admin
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-3 py-2 rounded-xl text-sm border ${
            tab === 'users' ? 'bg-mu-gold text-mu-navy border-mu-gold' : 'bg-mu-blue text-white border-white/10'
          }`}
        >
          Users
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">{error}</div>
      )}

      {tab === 'payments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Pending payments</h2>
            <Badge tone="warning">{loading ? 'Loading' : `${filteredPayments.length} shown`}</Badge>
          </div>

          <input
            value={paymentsQuery}
            onChange={(e) => setPaymentsQuery(e.target.value)}
            placeholder="Search by name, username, phone, transaction code…"
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
          />

          {loading ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4 text-white/60">Loading pending payments…</div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4">
              <p className="text-white/80 font-medium">No pending payments</p>
              <p className="text-white/60 text-sm mt-1">
                When participants register, their payments will appear here for verification.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredPayments.map((p) => (
                <li key={p.id} className="bg-mu-blue rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold leading-tight">{p.full_name}</p>
                      <p className="text-white/70 text-sm mt-0.5">{p.efootball_username}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>{p.mpesa_transaction_code || p.phone_number || 'Reserved'}</Badge>
                        <Badge tone="success">KSH {p.amount}</Badge>
                      </div>
                    </div>
                    <Badge tone="warning">Pending</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleVerify(p.id, 'approve')}
                      className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(p.id, 'reject')}
                      className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'admins' && (
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="bg-mu-blue rounded-2xl border border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">Create admin</h2>
            <p className="text-white/60 text-sm mt-1">
              Admins can manage match reporting and real-time score updates.
            </p>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-xs text-white/70 mb-1">Full name</label>
                <input
                  type="text"
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-mu-navy/60 border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">eFootball username</label>
                <input
                  type="text"
                  value={adminForm.efootball_username}
                  onChange={(e) => setAdminForm((f) => ({ ...f, efootball_username: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-mu-navy/60 border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="e.g. jane_admin"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-mu-navy/60 border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-mu-gold text-mu-navy font-extrabold"
              >
                Create admin
              </button>
              <p className="text-white/50 text-xs">Tip: share credentials securely with the admin.</p>
            </div>
          </div>
        </form>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Users</h2>
            <Badge>{filteredUsers.length} shown</Badge>
          </div>

          <input
            value={usersQuery}
            onChange={(e) => setUsersQuery(e.target.value)}
            placeholder="Search users by name, username, role…"
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
          />

          <ul className="space-y-2">
            {filteredUsers.map((u) => (
              <li key={u.id} className="bg-mu-blue rounded-2xl px-4 py-3 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{u.full_name}</p>
                    <p className="text-white/60 text-sm truncate">{u.efootball_username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={u.role === 'super_admin' ? 'warning' : u.role === 'admin' ? 'neutral' : 'neutral'}>
                      {u.role}
                    </Badge>
                    {u.is_participant ? <Badge tone="success">Participant</Badge> : <Badge>Unverified</Badge>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

