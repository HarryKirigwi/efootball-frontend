import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getConfig,
  updateConfig,
  getPendingPayments,
  getUsersList,
  getUser,
  updateUser,
  getRounds,
  createRound,
  updateRound,
  deleteRound,
  getMatches,
  getSuggestedMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  publishMatch,
  startMatch,
  endMatch,
  approveUserAsParticipant,
  getActiveParticipants,
  eliminateParticipant,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

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

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-mu-blue border border-mu-gold/30 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [roundMatches, setRoundMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestRoundId, setSuggestRoundId] = useState('');
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [paymentsQuery, setPaymentsQuery] = useState('');
  const [usersQuery, setUsersQuery] = useState('');
  const [config, setConfig] = useState({ tournament_status: 'not_started' });
  const [configUpdating, setConfigUpdating] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [newRound, setNewRound] = useState({ name: '', round_number: '', total_matches: '' });
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [creatingAllSuggestions, setCreatingAllSuggestions] = useState(false);
  const [creatingAllProgress, setCreatingAllProgress] = useState({ current: 0, total: 0 });
  const [savingMatch, setSavingMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchForm, setEditMatchForm] = useState(null);
  const [endingMatch, setEndingMatch] = useState(null);
  const [endMatchForm, setEndMatchForm] = useState(null);
  const [endingMatchSaving, setEndingMatchSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newMatch, setNewMatch] = useState({
    round_id: '',
    match_title: '',
    venue: '',
    scheduled_at: '',
    participant_home_id: '',
    participant_away_id: '',
  });
  const [roundSearch, setRoundSearch] = useState('');
  const [homeSearch, setHomeSearch] = useState('');
  const [awaySearch, setAwaySearch] = useState('');
  const [creatingManualMatch, setCreatingManualMatch] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [manualMatchModalOpen, setManualMatchModalOpen] = useState(false);

  const getDefaultMatchTitle = (round, matchIndexOffset = 1) => {
    if (!round) return '';
    const n = (round.match_count ?? 0) + matchIndexOffset;
    const r = round.round_number ?? '';
    return `Match ${n} Round ${r}`;
  };

  const getDefaultScheduledAt = (round, indexInBatch = 0) => {
    if (!round) return null;
    const startDate = config.start_date ? new Date(config.start_date + 'T00:00:00') : new Date();
    const maxPerDay = Number(config.max_matches_per_day) || 10;
    const dayOffset = Math.floor(((round.match_count ?? 0) + indexInBatch) / maxPerDay);
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  };

  const [settingsForm, setSettingsForm] = useState({
    start_date: '',
    max_matches_per_day: '',
  });

  const loadCore = () => {
    setLoading(true);
    Promise.all([
      getPendingPayments().catch(() => ({ payments: [] })),
      getUsersList().catch(() => ({ users: [] })),
      getConfig().catch(() => ({ tournament_status: 'not_started' })),
    ])
      .then(([pRes, uRes, configRes]) => {
        setPayments(pRes.payments || []);
        setUsers(uRes.users || []);
        setConfig(configRes);
        setSettingsForm({
          start_date: configRes.start_date || '',
          max_matches_per_day: configRes.max_matches_per_day
            ? String(configRes.max_matches_per_day)
            : '',
        });
      })
      .finally(() => setLoading(false));
  };

  const loadRounds = () => {
    setRoundsLoading(true);
    setError('');
    getRounds()
      .then((r) => {
        const list = r.rounds || [];
        setRounds(list);
        if (!selectedRoundId && list.length > 0) {
          setSelectedRoundId(list[0].id);
        }
      })
      .catch((e) => {
        setRounds([]);
        setError(e.message || 'Failed to load rounds');
      })
      .finally(() => setRoundsLoading(false));
  };

  const loadMatchesForSelectedRound = () => {
    if (!selectedRoundId) {
      setRoundMatches([]);
      return;
    }
    setMatchesLoading(true);
    getMatches({ round_id: selectedRoundId })
      .then((r) => setRoundMatches(r.matches || []))
      .catch(() => setRoundMatches([]))
      .finally(() => setMatchesLoading(false));
  };

  useEffect(() => {
    loadCore();
    loadRounds();
  }, []);

  useEffect(() => {
    if (tab === 'fixtures') {
      loadMatchesForSelectedRound();
    }
  }, [tab, selectedRoundId]);

  const loadActivePlayers = () => {
    setPlayersLoading(true);
    getActiveParticipants()
      .then((res) => {
        setPlayers(res.participants || []);
      })
      .catch(() => {
        setPlayers([]);
      })
      .finally(() => setPlayersLoading(false));
  };

  useEffect(() => {
    if (tab === 'players') {
      loadActivePlayers();
    }
  }, [tab]);

  const handleVerify = async (id, action) => {
    setError('');
    try {
      await verifyPayment(id, action);
      loadCore();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggleRegistration = async () => {
    setError('');
    setConfigUpdating(true);
    try {
      const nextStatus = config.tournament_status === 'started' ? 'not_started' : 'started';
      const updated = await updateConfig({ tournament_status: nextStatus });
      setConfig(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfigUpdating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setConfigUpdating(true);
    try {
      const payload = {
        start_date: settingsForm.start_date || null,
        max_matches_per_day: settingsForm.max_matches_per_day
          ? Number(settingsForm.max_matches_per_day)
          : null,
      };
      const updated = await updateConfig(payload);
      setConfig(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfigUpdating(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    if (!newRound.name.trim() || !newRound.round_number || !newRound.total_matches) {
      setError('Fill all round fields');
      return;
    }
    setCreatingRound(true);
    try {
      await createRound({
        name: newRound.name.trim(),
        round_number: Number(newRound.round_number),
        total_matches: Number(newRound.total_matches),
      });
      setNewRound({ name: '', round_number: '', total_matches: '' });
      loadRounds();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingRound(false);
    }
  };

  const handleReleaseRound = async (roundId) => {
    setError('');
    try {
      await updateRound(roundId, { released: true });
      loadRounds();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRenameRound = async (round) => {
    const nextName = window.prompt('Enter new name for this round', round.name || '');
    if (!nextName) return;
    setError('');
    try {
      await updateRound(round.id, { name: nextName });
      loadRounds();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteRound = async (round) => {
    if (!window.confirm('Delete this round? You must delete its matches first.')) return;
    setError('');
    try {
      await deleteRound(round.id);
      if (selectedRoundId === round.id) {
        setSelectedRoundId('');
        setRoundMatches([]);
      }
      loadRounds();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLoadSuggestions = async () => {
    if (!selectedRoundId) return;
    setError('');
    setSuggestLoading(true);
    try {
      const res = await getSuggestedMatches(selectedRoundId);
      setSuggestions(res.suggestions || []);
      setSuggestRoundId(selectedRoundId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSuggestLoading(false);
    }
  };

  const openEditMatch = (match) => {
    setEditingMatch(match);
    setEditMatchForm({
      match_title: match.match_title || '',
      venue: match.venue || '',
      scheduled_at: match.scheduled_at ? match.scheduled_at.slice(0, 16) : '',
      participant_home_id: match.participant_home_id || '',
      participant_away_id: match.participant_away_id || '',
      published: !!match.published,
    });
  };

  const closeEditMatch = () => {
    setEditingMatch(null);
    setEditMatchForm(null);
  };

  const handleUseSuggestion = async (sugg, index) => {
    setError('');
    try {
      const targetRoundId = suggestRoundId || selectedRoundId;
      if (!targetRoundId) {
        setError('Select a round for these fixtures');
        return;
      }
      const targetRound = rounds.find((r) => r.id === targetRoundId);
      if (targetRound && targetRound.status === 'completed') {
        setError('Cannot add fixtures to a completed round');
        return;
      }
      const defaultScheduled = getDefaultScheduledAt(targetRound);
      await createMatch({
        round_id: targetRoundId,
        participant_home_id: sugg.home_participant_id,
        participant_away_id: sugg.away_participant_id,
        match_title: getDefaultMatchTitle(targetRound, 1),
        scheduled_at: defaultScheduled,
      });
      loadMatchesForSelectedRound();
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateAllSuggestions = async () => {
    setError('');
    const targetRoundId = suggestRoundId || selectedRoundId;
    if (!targetRoundId) {
      setError('Select a round for these fixtures');
      return;
    }
    const targetRound = rounds.find((r) => r.id === targetRoundId);
    if (targetRound && targetRound.status === 'completed') {
      setError('Cannot add fixtures to a completed round');
      return;
    }
    if (suggestions.length === 0) return;
    const total = suggestions.length;
    setCreatingAllSuggestions(true);
    setCreatingAllProgress({ current: 0, total });
    try {
      for (let i = 0; i < suggestions.length; i++) {
        setCreatingAllProgress({ current: i + 1, total });
        const sugg = suggestions[i];
        const defaultScheduled = getDefaultScheduledAt(targetRound, i);
        await createMatch({
          round_id: targetRoundId,
          participant_home_id: sugg.home_participant_id,
          participant_away_id: sugg.away_participant_id,
          match_title: getDefaultMatchTitle(targetRound, i + 1),
          scheduled_at: defaultScheduled,
        });
        await new Promise((r) => setTimeout(r, 50));
      }
      setSuggestions([]);
      setCreatingAllProgress({ current: 0, total: 0 });
      await loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingAllSuggestions(false);
      setCreatingAllProgress({ current: 0, total: 0 });
    }
  };

  const handlePublishMatch = async (match) => {
    setError('');
    try {
      await publishMatch(match.id);
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStartMatch = async (match) => {
    setError('');
    try {
      await startMatch(match.id);
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSaveMatchEdit = async () => {
    if (!editingMatch || !editMatchForm) return;
    setError('');
    const homeId = editMatchForm.participant_home_id || null;
    const awayId = editMatchForm.participant_away_id || null;
    if (homeId != null && awayId != null && homeId === awayId) {
      setError('Home and away participants must be different');
      return;
    }
    setSavingMatch(true);
    try {
      await updateMatch(editingMatch.id, {
        match_title: editMatchForm.match_title.trim() || null,
        venue: editMatchForm.venue.trim() || null,
        scheduled_at: editMatchForm.scheduled_at || null,
        participant_home_id: editMatchForm.participant_home_id || null,
        participant_away_id: editMatchForm.participant_away_id || null,
        published: !!editMatchForm.published,
      });
      closeEditMatch();
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingMatch(false);
    }
  };

  const openEndMatch = (match) => {
    setEndingMatch(match);
    setEndMatchForm({
      home_goals: match.home_goals ?? '',
      away_goals: match.away_goals ?? '',
      home_pass_accuracy: match.home_pass_accuracy ?? '',
      away_pass_accuracy: match.away_pass_accuracy ?? '',
      home_possession: match.home_possession ?? '',
      away_possession: match.away_possession ?? '',
    });
  };

  const closeEndMatch = () => {
    setEndingMatch(null);
    setEndMatchForm(null);
  };

  const handleConfirmEndMatch = async () => {
    if (!endingMatch || !endMatchForm) return;
    setError('');
    setEndingMatchSaving(true);
    try {
      await endMatch(endingMatch.id, {
        home_goals: Number(endMatchForm.home_goals ?? 0),
        away_goals: Number(endMatchForm.away_goals ?? 0),
        home_pass_accuracy:
          endMatchForm.home_pass_accuracy !== '' ? Number(endMatchForm.home_pass_accuracy) : null,
        away_pass_accuracy:
          endMatchForm.away_pass_accuracy !== '' ? Number(endMatchForm.away_pass_accuracy) : null,
        home_possession:
          endMatchForm.home_possession !== '' ? Number(endMatchForm.home_possession) : null,
        away_possession:
          endMatchForm.away_possession !== '' ? Number(endMatchForm.away_possession) : null,
      });
      closeEndMatch();
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    } finally {
      setEndingMatchSaving(false);
    }
  };

  const derived = useMemo(() => {
    const totalUsers = users.length;
    const adminAccounts = users.filter((u) => u.role === 'super_admin').length;
    const verifiedParticipants = users.filter((u) => u.is_participant).length;
    const pendingPayments = payments.length;
    return { totalUsers, adminAccounts, verifiedParticipants, pendingPayments };
  }, [payments.length, users]);

  const participantOptions = useMemo(
    () => users.filter((u) => u.is_participant && u.participant_id),
    [users]
  );

  const filteredRoundsForManual = useMemo(() => {
    const q = roundSearch.trim().toLowerCase();
    if (!q) return rounds;
    return rounds.filter((r) =>
      `round ${r.round_number} ${r.name || ''}`.toLowerCase().includes(q)
    );
  }, [roundSearch, rounds]);

  const filteredHomeParticipants = useMemo(() => {
    const excludeAwayId = newMatch.participant_away_id || null;
    let list = participantOptions;
    if (excludeAwayId != null) {
      list = list.filter((u) => u.participant_id !== excludeAwayId);
    }
    const q = homeSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      `${u.efootball_username || ''} ${u.full_name || ''}`.toLowerCase().includes(q)
    );
  }, [homeSearch, participantOptions, newMatch.participant_away_id]);

  const filteredAwayParticipants = useMemo(() => {
    const excludeHomeId = newMatch.participant_home_id || null;
    let list = participantOptions;
    if (excludeHomeId != null) {
      list = list.filter((u) => u.participant_id !== excludeHomeId);
    }
    const q = awaySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      `${u.efootball_username || ''} ${u.full_name || ''}`.toLowerCase().includes(q)
    );
  }, [awaySearch, participantOptions, newMatch.participant_home_id]);

  const unverifiedUsers = useMemo(
    () => users.filter((u) => !u.is_participant && u.role !== 'admin' && u.role !== 'super_admin'),
    [users]
  );

  const filteredUnverifiedUsers = useMemo(() => {
    const q = paymentsQuery.trim().toLowerCase();
    if (!q) return unverifiedUsers;
    return unverifiedUsers.filter((u) =>
      `${u.full_name || ''} ${u.efootball_username || ''} ${u.reg_no || ''} ${u.phone_number || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [paymentsQuery, unverifiedUsers]);

  const filteredUsers = useMemo(() => {
    const q = usersQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.full_name} ${u.efootball_username} ${u.role}`.toLowerCase().includes(q));
  }, [users, usersQuery]);

  const handleCreateManualMatch = async (e) => {
    e.preventDefault();
    setError('');
    const roundId = newMatch.round_id || selectedRoundId;
    if (!roundId) {
      setError('Select a round for the match');
      return;
    }
    if (!newMatch.participant_home_id || !newMatch.participant_away_id) {
      setError('Select both home and away participants');
      return;
    }
    if (newMatch.participant_home_id === newMatch.participant_away_id) {
      setError('Home and away participants must be different');
      return;
    }
    setCreatingManualMatch(true);
    try {
      const targetRound = rounds.find((r) => r.id === roundId);
      if (targetRound && targetRound.status === 'completed') {
        setError('Cannot create matches in a completed round');
        setCreatingManualMatch(false);
        return;
      }
      const defaultTitle = targetRound ? getDefaultMatchTitle(targetRound) : null;
      const defaultScheduled = targetRound ? getDefaultScheduledAt(targetRound) : null;
      await createMatch({
        round_id: roundId,
        participant_home_id: newMatch.participant_home_id,
        participant_away_id: newMatch.participant_away_id,
        match_title: newMatch.match_title.trim() || defaultTitle,
        venue: newMatch.venue.trim() || null,
        scheduled_at: newMatch.scheduled_at?.trim() || defaultScheduled,
      });
      setNewMatch({
        round_id: '',
        match_title: '',
        venue: '',
        scheduled_at: '',
        participant_home_id: '',
        participant_away_id: '',
      });
      setHomeSearch('');
      setAwaySearch('');
      if (!selectedRoundId) {
        setSelectedRoundId(roundId);
      }
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingManualMatch(false);
    }
  };

  const handleDeleteMatch = async (match) => {
    if (!window.confirm('Delete this match? This cannot be undone.')) return;
    setError('');
    try {
      await deleteMatch(match.id);
      loadMatchesForSelectedRound();
    } catch (e) {
      setError(e.message);
    }
  };

  const openViewUser = async (u) => {
    setError('');
    try {
      const data = await getUser(u.id);
      setViewUser(data.user);
    } catch (e) {
      setError(e.message);
    }
  };

  const closeViewUser = () => {
    setViewUser(null);
  };

  const openEditUser = async (u) => {
    setError('');
    try {
      const data = await getUser(u.id);
      const usr = data.user;
      setEditingUser(usr);
      setEditUserForm({
        full_name: usr.full_name || '',
        efootball_username: usr.efootball_username || '',
        reg_no: usr.reg_no || '',
        phone_number: usr.phone_number || '',
        is_participant: !!usr.is_participant,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setEditUserForm(null);
    setSavingUser(false);
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser || !editUserForm) return;
    setError('');
    setSavingUser(true);
    try {
      await updateUser(editingUser.id, {
        full_name: editUserForm.full_name,
        efootball_username: editUserForm.efootball_username,
        reg_no: editUserForm.reg_no,
        phone_number: editUserForm.phone_number,
        is_participant: !!editUserForm.is_participant,
      });
      closeEditUser();
      loadCore();
    } catch (e) {
      setError(e.message);
      setSavingUser(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Participants' },
    { id: 'rounds', label: 'Rounds' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'players', label: 'Players' },
    { id: 'settings', label: 'Settings' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-mu-navy/95">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        {/* Desktop sidebar - sticky so it does not scroll with content */}
        <aside className="hidden md:flex md:w-64 md:sticky md:top-0 md:self-start md:h-screen md:flex-col bg-mu-blue border-r border-mu-gold/20 py-6 px-4 space-y-6 overflow-y-auto">
          <div className="px-1">
            <h1 className="text-xl font-bold text-mu-gold">Super Admin</h1>
            <p className="text-white/60 text-xs mt-1">
              Control registrations, approve participants, manage rounds and fixtures.
            </p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
                  tab === item.id
                    ? 'bg-mu-gold text-mu-navy border-mu-gold'
                    : 'bg-mu-navy/60 text-white border-white/10 hover:bg-mu-navy/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right-hand shell */}
        <div className="flex-1 flex flex-col bg-mu-blue/40 min-w-0">
          {/* Top bar - sticky so it does not scroll with content */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 bg-mu-blue/70 shrink-0">
            {/* Mobile hamburger + title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/20 bg-mu-blue px-2.5 py-2 text-white"
                aria-label="Open navigation"
              >
                <span className="sr-only">Open navigation</span>
                <span className="flex flex-col gap-0.5">
                  <span className="block h-0.5 w-5 bg-white rounded-full" />
                  <span className="block h-0.5 w-5 bg-white rounded-full" />
                  <span className="block h-0.5 w-5 bg-white rounded-full" />
                </span>
              </button>
              <div>
                <p className="text-xs text-white/60">Dashboard</p>
                <p className="text-sm md:text-base font-semibold text-white">Tournament control panel</p>
              </div>
            </div>

            {/* Mobile admin name + logout */}
            <div className="flex md:hidden items-center gap-2 text-[11px] text-white/70">
              <span className="truncate max-w-[110px]">
                {user?.full_name || user?.efootball_username || 'Super admin'}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Logout
              </button>
            </div>

            {/* Desktop admin name + logout */}
            <div className="hidden md:flex items-center gap-3 text-xs text-white/70">
              <span className="truncate max-w-[180px]">
                {user?.full_name || user?.efootball_username || 'Super admin'}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] border border-white/15"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 px-4 md:px-6 py-4 md:py-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-xl">
                <StatCard label="Pending payments" value={derived.pendingPayments} hint="Awaiting verification" />
                <StatCard label="Verified participants" value={derived.verifiedParticipants} hint="Eligible for pairing" />
                <StatCard label="Super admin accounts" value={derived.adminAccounts} hint="Should normally be 1" />
                <StatCard label="Total users" value={derived.totalUsers} hint="All registered accounts" />
              </div>
              <button
                type="button"
                onClick={() => {
                  loadCore();
                  loadRounds();
                  if (tab === 'fixtures') loadMatchesForSelectedRound();
                }}
                className="self-start shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm border border-white/10"
              >
                Refresh data
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">{error}</div>
            )}

            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-mu-blue rounded-2xl border border-mu-gold/20 p-5">
                  <h2 className="text-lg font-semibold text-white">Registration & tournament status</h2>
                  <p className="text-white/60 text-sm mt-1">
                    Control when new participants can reserve a spot. When registration is turned off, the landing page
                    becomes a fixtures and results view only.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge tone={config.tournament_status === 'started' ? 'warning' : 'success'}>
                      {config.tournament_status === 'started'
                        ? 'Registration OFF – tournament started'
                        : 'Registration ON'}
                    </Badge>
                    <button
                      type="button"
                      onClick={handleToggleRegistration}
                      disabled={configUpdating}
                      className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy font-semibold text-sm disabled:opacity-60"
                    >
                      {configUpdating
                        ? 'Updating…'
                        : config.tournament_status === 'started'
                          ? 'Turn on registration'
                          : 'Turn off registration'}
                    </button>
                  </div>
                </div>
              </div>
            )}

      {tab === 'payments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Unverified participants</h2>
            <Badge tone="warning">
              {loading ? 'Loading' : `${filteredUnverifiedUsers.length} shown`}
            </Badge>
          </div>

          <input
            value={paymentsQuery}
            onChange={(e) => setPaymentsQuery(e.target.value)}
            placeholder="Search by name, username, reg no, phone…"
            className="w-full px-4 py-3 rounded-xl bg-mu-blue border border-white/10 text-white placeholder-white/40 outline-none focus:border-mu-gold/60"
          />

          {loading ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4 text-white/60">
              Loading participants…
            </div>
          ) : filteredUnverifiedUsers.length === 0 ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4">
              <p className="text-white/80 font-medium">No unverified participants</p>
              <p className="text-white/60 text-sm mt-1">
                Once new players register, they will appear here for approval.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredUnverifiedUsers.map((u) => (
                <li
                  key={u.id}
                  className="bg-mu-blue rounded-2xl px-4 py-3 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{u.full_name}</p>
                    <p className="text-white/70 text-xs truncate">@{u.efootball_username}</p>
                    {(u.reg_no || u.phone_number) && (
                      <p className="text-white/50 text-[11px] mt-0.5 truncate">
                        {u.reg_no ? `Reg: ${u.reg_no}` : ''}
                        {u.reg_no && u.phone_number ? ' · ' : ''}
                        {u.phone_number ? `Tel: ${u.phone_number}` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      try {
                        await approveUserAsParticipant(u.id);
                        loadCore();
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shrink-0"
                  >
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'rounds' && (
        <div className="space-y-4">
          <div className="bg-mu-blue rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-white">Rounds</h2>
              <Badge tone={roundsLoading ? 'warning' : 'neutral'}>
                {roundsLoading ? 'Loading…' : `${rounds.length} rounds`}
              </Badge>
            </div>
            {rounds.length === 0 ? (
              <p className="text-white/70 text-sm">No rounds yet. Create the first round to start suggesting fixtures.</p>
            ) : (
              <ul className="space-y-2">
                {rounds.map((r) => (
                  <li key={r.id} className="bg-mu-navy/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">
                        Round {r.round_number}: {r.name}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">
                        Matches: {r.match_count ?? r.total_matches} · Status: {r.status} · Released:{' '}
                        {r.released ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRenameRound(r)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/20"
                      >
                        Rename
                      </button>
                      {!r.released && (
                        <button
                          type="button"
                          onClick={() => handleReleaseRound(r.id)}
                          className="px-3 py-1.5 rounded-xl bg-mu-gold text-mu-navy text-xs font-semibold"
                        >
                          Release
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteRound(r)}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 text-white text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleCreateRound} className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="text-white font-semibold text-base">Create round</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  value={newRound.name}
                  onChange={(e) => setNewRound((r) => ({ ...r, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="e.g. Round of 32"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Round number</label>
                <input
                  type="number"
                  min={1}
                  value={newRound.round_number}
                  onChange={(e) => setNewRound((r) => ({ ...r, round_number: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Total matches (approx)</label>
                <input
                  type="number"
                  min={1}
                  value={newRound.total_matches}
                  onChange={(e) => setNewRound((r) => ({ ...r, total_matches: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                  placeholder="e.g. 16"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creatingRound}
              className="mt-2 px-4 py-2 rounded-xl bg-mu-gold text-mu-navy font-semibold text-sm disabled:opacity-60"
            >
              {creatingRound ? 'Creating…' : 'Create round'}
            </button>
          </form>
        </div>
      )}

      {tab === 'fixtures' && (
        <div className="space-y-4">
          <div className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Fixtures</h2>
              <div className="flex items-center gap-2">
                <Badge tone={matchesLoading ? 'warning' : 'neutral'}>
                  {matchesLoading ? 'Loading…' : `${roundMatches.length} matches`}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    const rid = selectedRoundId || '';
                    const round = rounds.find((r) => r.id === rid);
                    const title = round ? getDefaultMatchTitle(round) : '';
                    const scheduled = round ? getDefaultScheduledAt(round) : '';
                    const scheduledLocal = scheduled ? scheduled.slice(0, 16) : '';
                    setNewMatch((m) => ({ ...m, round_id: rid, match_title: title, scheduled_at: scheduledLocal }));
                    setManualMatchModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-mu-gold text-mu-navy text-xs font-semibold"
                >
                  Add a match
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60 min-w-[160px]"
              >
                <option value="">Select round…</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.round_number}: {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadMatchesForSelectedRound}
                className="px-3 py-2 rounded-xl bg-white/10 text-white text-sm border border-white/20"
              >
                Reload matches
              </button>
              <button
                type="button"
                onClick={handleLoadSuggestions}
                disabled={!selectedRoundId || suggestLoading}
                className="px-3 py-2 rounded-xl bg-mu-gold text-mu-navy text-sm font-semibold disabled:opacity-60"
              >
                {suggestLoading ? 'Loading suggestions…' : 'Get suggested fixtures'}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-white/70 text-sm">Suggested pairings (click to create matches):</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateAllSuggestions}
                      disabled={creatingAllSuggestions}
                      className="px-3 py-1.5 rounded-xl bg-mu-gold text-mu-navy text-xs font-semibold disabled:opacity-60"
                    >
                      {creatingAllSuggestions
                        ? (creatingAllProgress.total > 0
                          ? `Creating ${creatingAllProgress.current} of ${creatingAllProgress.total}…`
                          : 'Creating…')
                        : 'Create all'}
                    </button>
                    <span className="text-xs text-white/60">Target round:</span>
                    <select
                      value={suggestRoundId || selectedRoundId || ''}
                      onChange={(e) => setSuggestRoundId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-xs outline-none focus:border-mu-gold/60 min-w-[140px]"
                    >
                      <option value="">Select round…</option>
                      {rounds.map((r) => (
                        <option key={r.id} value={r.id} disabled={r.status === 'completed'}>
                          Round {r.round_number}: {r.name} {r.status === 'completed' ? ' (completed)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ul className="space-y-1">
                  {suggestions.map((sugg, idx) => (
                    <li
                      key={`${sugg.home_participant_id}-${sugg.away_participant_id}-${idx}`}
                      className="flex items-center justify-between gap-3 bg-mu-navy/60 rounded-xl px-3 py-2 text-sm"
                    >
                      <span className="text-white/80">
                        {sugg.home_username} vs {sugg.away_username}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUseSuggestion(sugg, idx)}
                        className="px-3 py-1 rounded-xl bg-mu-gold text-mu-navy text-xs font-semibold"
                      >
                        Create match
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-mu-blue rounded-2xl border border-white/10 p-5 space-y-3">
            {selectedRoundId && roundMatches.length === 0 && !matchesLoading && (
              <p className="text-white/70 text-sm">No matches for this round yet. Use suggestions or create manually.</p>
            )}
            {roundMatches.length > 0 && (
              <ul className="space-y-3">
                {roundMatches.map((m) => (
                  <li key={m.id} className="bg-mu-navy/60 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {m.match_title || 'Untitled match'}
                        </p>
                        <p className="text-white/70 text-xs mt-0.5">
                          {m.home_username || 'TBD'} vs {m.away_username || 'TBD'}
                        </p>
                        <p className="text-white/60 text-xs mt-0.5">
                          Status: {m.status} · Published: {m.published ? 'Yes' : 'No'} · Venue:{' '}
                          {m.venue || 'TBC'}
                        </p>
                      </div>
                      <Badge tone={m.status === 'completed' ? 'success' : m.status === 'ongoing' ? 'warning' : 'neutral'}>
                        {m.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => openEditMatch(m)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/20"
                      >
                        Edit
                      </button>
                      {m.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleStartMatch(m)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/20"
                        >
                          Start
                        </button>
                      )}
                      {m.status === 'ongoing' && (
                        <button
                          type="button"
                          onClick={() => openEndMatch(m)}
                          className="px-3 py-1.5 rounded-xl bg-mu-gold text-mu-navy text-xs font-semibold"
                        >
                          End & enter score
                        </button>
                      )}
                      {!m.published && (
                        <button
                          type="button"
                          onClick={() => handlePublishMatch(m)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-100 text-xs border border-emerald-400/40"
                        >
                          Publish
                        </button>
                      )}
                      {m.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(m)}
                          className="px-3 py-1.5 rounded-xl bg-red-600/80 text-white text-xs font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'players' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active players</h2>
            <Badge tone={playersLoading ? 'warning' : 'neutral'}>
              {playersLoading ? 'Loading…' : `${players.length} active`}
            </Badge>
          </div>

          {playersLoading ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4 text-white/70 text-sm">
              Loading active participants…
            </div>
          ) : players.length === 0 ? (
            <div className="bg-mu-blue rounded-2xl border border-white/10 p-4">
              <p className="text-white/80 font-medium">No active participants</p>
              <p className="text-white/60 text-sm mt-1">
                Players who have already been paired into fixtures and are not eliminated will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {players.map((p) => (
                <li
                  key={p.id}
                  className="bg-mu-blue rounded-2xl px-4 py-3 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{p.full_name}</p>
                    <p className="text-white/70 text-xs truncate">@{p.efootball_username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Eliminate this player from the tournament?')) return;
                      setError('');
                      try {
                        await eliminateParticipant(p.id);
                        setPlayers((prev) => prev.filter((x) => x.id !== p.id));
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600/80 text-white text-xs font-semibold shrink-0"
                  >
                    Eliminate
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-mu-blue rounded-2xl border border-mu-gold/20 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-white">Tournament settings</h2>
            <p className="text-white/60 text-sm">
              Configure the tournament start date and how many matches can be played per day.
              These settings are used when planning and displaying fixtures across the week.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-white/70 mb-1">Tournament start date</label>
                <input
                  type="date"
                  value={settingsForm.start_date || ''}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      start_date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Max matches per day</label>
                <input
                  type="number"
                  min={1}
                  value={settingsForm.max_matches_per_day}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      max_matches_per_day: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                  placeholder="e.g. 8"
                />
              </div>
              <button
                type="submit"
                disabled={configUpdating}
                className="mt-2 px-4 py-2 rounded-xl bg-mu-gold text-mu-navy font-semibold text-sm disabled:opacity-60"
              >
                {configUpdating ? 'Saving…' : 'Save settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Modal
        open={manualMatchModalOpen}
        title="Add a match"
        onClose={() => setManualMatchModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setManualMatchModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateManualMatch}
              disabled={creatingManualMatch}
              className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy text-sm font-semibold disabled:opacity-60"
            >
              {creatingManualMatch ? 'Creating…' : 'Create match'}
            </button>
          </>
        }
      >
        <form
          onSubmit={handleCreateManualMatch}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Round</label>
              <input
                type="text"
                value={roundSearch}
                onChange={(e) => setRoundSearch(e.target.value)}
                placeholder="Type to filter rounds…"
                className="w-full mb-2 px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-xs placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
              <select
                value={newMatch.round_id || selectedRoundId || ''}
                onChange={(e) => {
                  const roundId = e.target.value;
                  const round = rounds.find((r) => r.id === roundId);
                  const title = round ? getDefaultMatchTitle(round) : '';
                  const scheduled = round ? getDefaultScheduledAt(round) : '';
                  const scheduledLocal = scheduled ? scheduled.slice(0, 16) : '';
                  setNewMatch((m) => ({ ...m, round_id: roundId, match_title: title, scheduled_at: scheduledLocal }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
              >
                <option value="">Select round…</option>
                {filteredRoundsForManual.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.round_number}: {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Match title (optional)</label>
              <input
                type="text"
                value={newMatch.match_title}
                onChange={(e) =>
                  setNewMatch((m) => ({
                    ...m,
                    match_title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                placeholder="e.g. Match 1 Round 1"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Venue (optional)</label>
              <input
                type="text"
                value={newMatch.venue}
                onChange={(e) =>
                  setNewMatch((m) => ({
                    ...m,
                    venue: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                placeholder="e.g. Hall A"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Date &amp; time (optional)</label>
            <input
              type="datetime-local"
              value={newMatch.scheduled_at}
              onChange={(e) =>
                setNewMatch((m) => ({
                  ...m,
                  scheduled_at: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Home participant</label>
              <input
                type="text"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                placeholder="Type to search participants…"
                className="w-full mb-2 px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-xs placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
              <select
                value={newMatch.participant_home_id}
                onChange={(e) =>
                  setNewMatch((m) => ({
                    ...m,
                    participant_home_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
              >
                <option value="">Select home participant…</option>
                {filteredHomeParticipants.map((u) => (
                  <option key={u.id} value={u.participant_id}>
                    {u.efootball_username || u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Away participant</label>
              <input
                type="text"
                value={awaySearch}
                onChange={(e) => setAwaySearch(e.target.value)}
                placeholder="Type to search participants…"
                className="w-full mb-2 px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-xs placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
              <select
                value={newMatch.participant_away_id}
                onChange={(e) =>
                  setNewMatch((m) => ({
                    ...m,
                    participant_away_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
              >
                <option value="">Select away participant…</option>
                {filteredAwayParticipants.map((u) => (
                  <option key={u.id} value={u.participant_id}>
                    {u.efootball_username || u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingMatch && !!editMatchForm}
        title="Edit match"
        onClose={closeEditMatch}
        footer={
          <>
            <button
              type="button"
              onClick={closeEditMatch}
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveMatchEdit}
              disabled={savingMatch}
              className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy text-sm font-semibold disabled:opacity-60"
            >
              {savingMatch ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        {editMatchForm && (
          <>
            <div>
              <label className="block text-xs text-white/70 mb-1">Match title</label>
              <input
                type="text"
                value={editMatchForm.match_title}
                onChange={(e) => setEditMatchForm((f) => ({ ...f, match_title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                placeholder="e.g. Match 1 Round 1"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Venue</label>
              <input
                type="text"
                value={editMatchForm.venue}
                onChange={(e) => setEditMatchForm((f) => ({ ...f, venue: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
                placeholder="e.g. Hall A"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Date &amp; time</label>
              <input
                type="datetime-local"
                value={editMatchForm.scheduled_at}
                onChange={(e) => setEditMatchForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Home participant</label>
                {participantOptions.length > 0 ? (
                  <select
                    value={editMatchForm.participant_home_id || ''}
                    onChange={(e) =>
                      setEditMatchForm((f) => ({
                        ...f,
                        participant_home_id: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                  >
                    <option value="">TBD</option>
                    {participantOptions
                      .filter((u) => u.participant_id !== (editMatchForm.participant_away_id || null))
                      .map((u) => (
                        <option key={u.id} value={u.participant_id}>
                          {u.efootball_username || u.full_name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-xs text-white/60">Participants list not available.</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Away participant</label>
                {participantOptions.length > 0 ? (
                  <select
                    value={editMatchForm.participant_away_id || ''}
                    onChange={(e) =>
                      setEditMatchForm((f) => ({
                        ...f,
                        participant_away_id: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                  >
                    <option value="">TBD</option>
                    {participantOptions
                      .filter((u) => u.participant_id !== (editMatchForm.participant_home_id || null))
                      .map((u) => (
                        <option key={u.id} value={u.participant_id}>
                          {u.efootball_username || u.full_name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-xs text-white/60">Participants list not available.</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="edit-match-published"
                type="checkbox"
                checked={!!editMatchForm.published}
                onChange={(e) => setEditMatchForm((f) => ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded border-white/30 bg-mu-navy/60 text-mu-gold focus:ring-mu-gold/70"
              />
              <label htmlFor="edit-match-published" className="text-xs text-white/80">
                Published (visible on landing page)
              </label>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!endingMatch && !!endMatchForm}
        title="End match & enter stats"
        onClose={closeEndMatch}
        footer={
          <>
            <button
              type="button"
              onClick={closeEndMatch}
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmEndMatch}
              disabled={endingMatchSaving}
              className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy text-sm font-semibold disabled:opacity-60"
            >
              {endingMatchSaving ? 'Saving…' : 'Save result'}
            </button>
          </>
        }
      >
        {endingMatch && endMatchForm && (
          <>
            <p className="text-white/70 text-sm">
              {endingMatch.home_username || 'Home'} vs {endingMatch.away_username || 'Away'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  Home goals ({endingMatch.home_username || 'Home'})
                </label>
                <input
                  type="number"
                  min={0}
                  value={endMatchForm.home_goals}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({ ...f, home_goals: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">
                  Away goals ({endingMatch.away_username || 'Away'})
                </label>
                <input
                  type="number"
                  min={0}
                  value={endMatchForm.away_goals}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({ ...f, away_goals: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Home pass accuracy (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={endMatchForm.home_pass_accuracy}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({
                      ...f,
                      home_pass_accuracy: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Away pass accuracy (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={endMatchForm.away_pass_accuracy}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({
                      ...f,
                      away_pass_accuracy: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1">Home possession (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={endMatchForm.home_possession}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({
                      ...f,
                      home_possession: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1">Away possession (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={endMatchForm.away_possession}
                  onChange={(e) =>
                    setEndMatchForm((f) => ({
                      ...f,
                      away_possession: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm outline-none focus:border-mu-gold/60"
                />
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!viewUser}
        title="User details"
        onClose={closeViewUser}
        footer={
          <button
            type="button"
            onClick={closeViewUser}
            className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm border border-white/10"
          >
            Close
          </button>
        }
      >
        {viewUser && (
          <div className="space-y-2 text-sm text-white/80">
            <div>
              <p className="text-xs text-white/60">Full name</p>
              <p className="font-medium">{viewUser.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Username</p>
              <p className="font-medium">@{viewUser.efootball_username}</p>
            </div>
            {viewUser.reg_no && (
              <div>
                <p className="text-xs text-white/60">Admission / Reg. number</p>
                <p className="font-medium">{viewUser.reg_no}</p>
              </div>
            )}
            {viewUser.phone_number && (
              <div>
                <p className="text-xs text-white/60">Phone number</p>
                <p className="font-medium">{viewUser.phone_number}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-white/60">Role</p>
              <p className="font-medium">{viewUser.role}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Participant status</p>
              <p className="font-medium">{viewUser.is_participant ? 'Verified participant' : 'Not verified'}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editingUser && !!editUserForm}
        title="Edit user"
        onClose={closeEditUser}
        footer={
          <>
            <button
              type="button"
              onClick={closeEditUser}
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUserEdit}
              disabled={savingUser}
              className="px-4 py-2 rounded-xl bg-mu-gold text-mu-navy text-sm font-semibold disabled:opacity-60"
            >
              {savingUser ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        {editUserForm && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Full name</label>
              <input
                type="text"
                value={editUserForm.full_name}
                onChange={(e) =>
                  setEditUserForm((f) => ({
                    ...f,
                    full_name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Username</label>
              <input
                type="text"
                value={editUserForm.efootball_username}
                onChange={(e) =>
                  setEditUserForm((f) => ({
                    ...f,
                    efootball_username: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Admission / Reg. number</label>
              <input
                type="text"
                value={editUserForm.reg_no}
                onChange={(e) =>
                  setEditUserForm((f) => ({
                    ...f,
                    reg_no: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">Phone number</label>
              <input
                type="tel"
                value={editUserForm.phone_number}
                onChange={(e) =>
                  setEditUserForm((f) => ({
                    ...f,
                    phone_number: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-mu-navy/60 border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:border-mu-gold/60"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="edit-user-participant"
                type="checkbox"
                checked={!!editUserForm.is_participant}
                onChange={(e) =>
                  setEditUserForm((f) => ({
                    ...f,
                    is_participant: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-white/30 bg-mu-navy/60 text-mu-gold focus:ring-mu-gold/70"
              />
              <label htmlFor="edit-user-participant" className="text-xs text-white/80">
                Verified participant (uncheck to unverify)
              </label>
            </div>
          </div>
        )}
      </Modal>
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

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-mu-blue">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-mu-navy/60 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-semibold">Full name</th>
                  <th className="px-3 py-2 font-semibold">Username</th>
                  <th className="px-3 py-2 font-semibold">Participant</th>
                  <th className="px-3 py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-white/70 text-center">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-mu-navy/40">
                      <td className="px-3 py-2 max-w-[200px]">
                        <p className="text-white font-medium truncate text-sm">{u.full_name}</p>
                      </td>
                      <td className="px-3 py-2 max-w-[180px]">
                        <p className="text-white/80 truncate text-xs">@{u.efootball_username}</p>
                      </td>
                      <td className="px-3 py-2">
                        {u.is_participant ? <Badge tone="success">Participant</Badge> : <Badge>Unverified</Badge>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openViewUser(u)}
                            className="px-2.5 py-1 rounded-lg border border-white/25 text-white text-[11px] hover:bg-white/10"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-mu-gold text-mu-navy text-[11px] font-semibold hover:bg-mu-gold/90"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
          </main>
        </div>
      </div>

      {/* Mobile slide-over navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex-1 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <div className="w-72 max-w-[80%] bg-mu-blue border-l border-mu-gold/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <h2 className="text-lg font-semibold text-mu-gold">Super Admin</h2>
                <p className="text-white/60 text-xs">Navigate dashboard sections</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Close navigation"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
                    tab === item.id
                      ? 'bg-mu-gold text-mu-navy border-mu-gold'
                      : 'bg-mu-navy/60 text-white border-white/10 hover:bg-mu-navy/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

