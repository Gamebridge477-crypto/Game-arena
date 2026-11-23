import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  GitBranch,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';
import { canUserManageTournament, formatExplicitDate } from '../shared/logic';
import type { Tournament, TournamentMatch, TournamentRegistration } from '../shared/types';
import tournamentStageImg from '../assets/images/tournament_stage_cup_1794620721742.jpg';

const ESCROW_LABEL: Record<Tournament['prizeEscrowStatus'], string> = {
  pledged: 'Organizer Pledged',
  verified_escrow: 'Escrow Verified',
  disbursed: 'Prize Disbursed',
};

export function TournamentsPage() {
  const { user, selectedTournamentId, navigate } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedId, setSelectedId] = useState<string | null>(selectedTournamentId);
  const [detail, setDetail] = useState<{
    tournament: Tournament;
    participants: TournamentRegistration[];
    matches: TournamentMatch[];
  } | null>(null);

  // Registration form
  const [teamName, setTeamName] = useState('');
  const [inGameId, setInGameId] = useState('');

  // Create tournament modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGame, setNewGame] = useState('Valorant');
  const [newRegion, setNewRegion] = useState('Ethiopia (Online)');
  const [newFormat, setNewFormat] = useState('5v5 Single Elimination');
  const [newPrize, setNewPrize] = useState('50,000 ETB');
  const [newPayoutRail, setNewPayoutRail] = useState('Telebirr / CBE Birr Direct Claim (Zero Fee)');
  const [newMax, setNewMax] = useState(16);
  const [newDeadline, setNewDeadline] = useState('2026-12-20');
  const [newStart, setNewStart] = useState('2026-12-23');
  const [newSchedule, setNewSchedule] = useState('');
  const [newRules, setNewRules] = useState('');

  // Score Reporting Modal
  const [scoreTarget, setScoreTarget] = useState<TournamentMatch | null>(null);
  const [scoreA, setScoreA] = useState('2');
  const [scoreB, setScoreB] = useState('0');

  // Match Dispute / Report Modal
  const [disputeMatch, setDisputeMatch] = useState<TournamentMatch | null>(null);
  const [disputeReason, setDisputeReason] = useState('Score / Result Discrepancy');
  const [disputeDetails, setDisputeDetails] = useState('');

  // Organizer result update
  const [resultsInput, setResultsInput] = useState('');
  const [statusInput, setStatusInput] = useState<'open' | 'ongoing' | 'completed'>('open');
  const [checkInOpenInput, setCheckInOpenInput] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTournamentId) {
      setSelectedId(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (gameFilter !== 'All') params.set('game', gameFilter);
    if (statusFilter !== 'All') params.set('status', statusFilter);

    try {
      const data = await apiRequest<{ tournaments: Tournament[] }>(`/api/tournaments?${params.toString()}`);
      setTournaments(data.tournaments);
      if (data.tournaments.length > 0 && !selectedId) {
        const firstOpen = data.tournaments.find((t) => t.status === 'open' || t.status === 'ongoing');
        setSelectedId((firstOpen || data.tournaments[0]).id);
      }
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [search, gameFilter, statusFilter, selectedId]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const data = await apiRequest<{
        tournament: Tournament;
        participants: TournamentRegistration[];
        matches: TournamentMatch[];
      }>(`/api/tournaments/${id}`);
      setDetail(data);
      setResultsInput(data.tournament.resultsSummary || '');
      setCheckInOpenInput(data.tournament.checkInOpen);
      if (
        data.tournament.status === 'open' ||
        data.tournament.status === 'ongoing' ||
        data.tournament.status === 'completed'
      ) {
        setStatusInput(data.tournament.status);
      }
    } catch {
      setDetail(null);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('auth', { authMode: 'login' });
      return;
    }
    if (!detail) return;
    setErrorMsg(null);
    try {
      await apiRequest(`/api/tournaments/${detail.tournament.id}/register`, {
        method: 'POST',
        body: JSON.stringify({ teamName, inGameId }),
      });
      setFeedback(`Registered for "${detail.tournament.title}". Complete Check-In below before bracket lock.`);
      setTeamName('');
      setInGameId('');
      await loadDetail(detail.tournament.id);
      await loadTournaments();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Registration failed.');
    }
  };

  const handleCheckIn = async () => {
    if (!user || !detail) return;
    setErrorMsg(null);
    try {
      await apiRequest(`/api/tournaments/${detail.tournament.id}/checkin`, { method: 'POST' });
      setFeedback(`Check-in confirmed for "${detail.tournament.title}".`);
      await loadDetail(detail.tournament.id);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Check-in failed.');
    }
  };

  const handleGenerateBracket = async () => {
    if (!detail) return;
    setErrorMsg(null);
    try {
      await apiRequest(`/api/tournaments/${detail.tournament.id}/bracket/generate`, { method: 'POST' });
      setFeedback('Single-elimination bracket generated with deterministic Match IDs.');
      await loadDetail(detail.tournament.id);
      await loadTournaments();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not generate bracket.');
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !scoreTarget) return;
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ winnerName: string }>(
        `/api/tournaments/${detail.tournament.id}/matches/${scoreTarget.id}/report-score`,
        {
          method: 'POST',
          body: JSON.stringify({ scoreA: Number(scoreA), scoreB: Number(scoreB) }),
        }
      );
      setFeedback(`Match ${scoreTarget.id} result recorded: ${res.winnerName} advances (+ranking pts awarded).`);
      setScoreTarget(null);
      await loadDetail(detail.tournament.id);
      await loadTournaments();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not save match score.');
    }
  };

  const handleFileMatchDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('auth', { authMode: 'login' });
      return;
    }
    if (!disputeMatch || !detail) return;
    setErrorMsg(null);
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'match',
          targetId: disputeMatch.id,
          targetLabel: `${detail.tournament.title} (${disputeMatch.id})`,
          matchId: disputeMatch.id,
          reason: disputeReason,
          details: disputeDetails,
        }),
      });
      setFeedback(`Dispute filed for Match ${disputeMatch.id}. Track moderator response under your Profile.`);
      setDisputeMatch(null);
      setDisputeDetails('');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not submit match dispute.');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('auth', { authMode: 'login' });
      return;
    }
    setErrorMsg(null);
    try {
      const created = await apiRequest<{ id: string; status: string }>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          gameTitle: newGame,
          region: newRegion,
          format: newFormat,
          prizePool: newPrize,
          prizePayoutRail: newPayoutRail,
          maxParticipants: newMax,
          registrationDeadline: `${newDeadline}T23:59:00Z`,
          startDate: `${newStart}T16:00:00Z`,
          scheduleSummary: newSchedule,
          rulesSummary: newRules,
        }),
      });
      setFeedback(
        created.status === 'open'
          ? `Tournament "${newTitle}" published and open for registration.`
          : `Tournament "${newTitle}" submitted for admin review.`
      );
      setShowCreate(false);
      setNewTitle('');
      setSelectedId(created.id);
      loadTournaments();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not create tournament.');
    }
  };

  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setErrorMsg(null);
    try {
      await apiRequest(`/api/tournaments/${detail.tournament.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusInput,
          resultsSummary: resultsInput,
          checkInOpen: checkInOpenInput,
        }),
      });
      setFeedback('Tournament schedule, check-in window, and results updated.');
      loadDetail(detail.tournament.id);
      loadTournaments();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Update failed.');
    }
  };

  const copyMatchId = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const activeT = detail?.tournament;
  const canManage = activeT
    ? canUserManageTournament(user ? { userId: user.userId, role: user.role } : null, {
        organizerId: activeT.organizerId,
      })
    : false;

  // Group bracket matches by round
  const roundsMap = new Map<number, { roundName: string; matches: TournamentMatch[] }>();
  for (const m of detail?.matches || []) {
    if (!roundsMap.has(m.roundNumber)) {
      roundsMap.set(m.roundNumber, { roundName: m.roundName, matches: [] });
    }
    roundsMap.get(m.roundNumber)!.matches.push(m);
  }
  const rounds = [...roundsMap.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header + Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-medium text-blue-400">Live Brackets, Check-In & Zero-Fee Escrow</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Esports Tournaments
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Register your squad, complete player check-in before lock, play assigned Match IDs, report verified results, and track transparent zero-fee prize claims.
            </p>
            <div className="pt-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!user) navigate('auth', { authMode: 'login' });
                  else setShowCreate(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white min-h-[40px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Create Tournament</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('rankings')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 min-h-[40px]"
              >
                <Trophy className="w-4 h-4 text-violet-400" aria-hidden="true" />
                <span>View Player Rankings</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-lg border border-slate-800 aspect-video bg-[#070B16]">
              <img
                src={tournamentStageImg}
                alt="Championship esports arena stage"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-4 py-2.5 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" aria-hidden="true" />
          <input
            type="text"
            aria-label="Search tournaments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments, cities..."
            className="w-full rounded-lg border border-slate-700 bg-[#060A14] pl-9 pr-3 py-2 text-xs text-white min-h-[40px]"
          />
        </div>
        <select
          aria-label="Filter tournaments by game"
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white min-h-[40px]"
        >
          <option value="All">All Games</option>
          <option value="EA FC 25">EA FC 25</option>
          <option value="Valorant">Valorant</option>
          <option value="PUBG Mobile">PUBG Mobile</option>
          <option value="Tekken 8">Tekken 8</option>
          <option value="Counter-Strike 2">Counter-Strike 2</option>
          <option value="Dota 2">Dota 2</option>
        </select>
        <select
          aria-label="Filter tournaments by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white min-h-[40px]"
        >
          <option value="All">All Statuses</option>
          <option value="open">Open for Registration</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed & Results</option>
          <option value="pending_approval">Pending Approval (Mine/Admin)</option>
        </select>
      </div>

      {/* Master-Detail Tournament Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3">
          {loading ? (
            <div className="h-64 rounded-xl border border-slate-800 bg-[#0B1120] animate-pulse" />
          ) : tournaments.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 text-center text-xs text-slate-400">
              No tournaments match your current filters.
            </div>
          ) : (
            tournaments.map((t) => {
              const selected = selectedId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    selected
                      ? 'border-blue-500 bg-[#0F172A]'
                      : 'border-slate-800 bg-[#0B1120] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-blue-400">{t.gameTitle}</span>
                    <span className="capitalize text-slate-400">{t.status.replace('_', ' ')}</span>
                  </div>
                  <h2 className="mt-1 font-display text-base font-semibold text-white">{t.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {t.region} · {t.format}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                    <span>Prize: {t.prizePool}</span>
                    <span className="font-mono tabular-nums">
                      {t.registeredCount}/{t.maxParticipants}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-8">
          {!activeT ? (
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-8 text-center text-sm text-slate-400">
              Select a tournament to view schedule, bracket tree, check-in, and registration.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span>
                    {activeT.gameTitle} · Hosted by @{activeT.organizerName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded px-2 py-0.5 bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
                      {ESCROW_LABEL[activeT.prizeEscrowStatus]}
                    </span>
                    <span className="font-mono uppercase text-blue-400">
                      {activeT.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">{activeT.title}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {activeT.region} · {activeT.format} · {activeT.prizePayoutRail}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y border-slate-800/80 py-4 text-xs">
                <div>
                  <p className="text-slate-400">Prize Pool (Zero Entry Fee)</p>
                  <p className="mt-1 font-semibold text-white">{activeT.prizePool}</p>
                </div>
                <div>
                  <p className="text-slate-400">Registration Deadline</p>
                  <p className="mt-1 font-mono tabular-nums text-white">
                    {formatExplicitDate(activeT.registrationDeadline)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Start Date</p>
                  <p className="mt-1 font-mono tabular-nums text-white">
                    {formatExplicitDate(activeT.startDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>Tournament Schedule</span>
                  </p>
                  <p className="mt-1 text-slate-300 leading-relaxed">{activeT.scheduleSummary}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Rules & Verification</p>
                  <p className="mt-1 text-slate-400 leading-relaxed">{activeT.rulesSummary}</p>
                </div>
                {activeT.resultsSummary && (
                  <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 p-3.5">
                    <p className="font-semibold text-violet-300 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Official Results</span>
                    </p>
                    <p className="mt-1 text-slate-200">{activeT.resultsSummary}</p>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              {activeT.status === 'open' && !activeT.isRegistered && (
                <form onSubmit={handleRegister} className="rounded-lg border border-slate-800 bg-[#070B16] p-4 space-y-3">
                  <p className="text-xs font-semibold text-white">Register for This Tournament</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team Name (or Solo)"
                      className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      required
                      value={inGameId}
                      onChange={(e) => setInGameId(e.target.value)}
                      placeholder="In-Game ID (e.g. Dawit#ETH)"
                      className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white min-h-[38px]"
                  >
                    Confirm Registration
                  </button>
                </form>
              )}

              {/* Registered + Pre-Match Check-In Flow */}
              {activeT.isRegistered && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>
                      {activeT.isCheckedIn
                        ? 'You are registered AND checked in for bracket seeding.'
                        : 'You are registered! Confirm player check-in before bracket lock.'}
                    </span>
                  </div>
                  {!activeT.isCheckedIn && activeT.checkInOpen && (
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                    >
                      Confirm Check-In Now
                    </button>
                  )}
                </div>
              )}

              {/* Live Single-Elimination Bracket Match Tree */}
              <div className="space-y-3 border-t border-slate-800/80 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span>Bracket Tree & Match IDs</span>
                  </h3>
                  {canManage && (
                    <button
                      type="button"
                      onClick={handleGenerateBracket}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                    >
                      {rounds.length > 0 ? 'Regenerate Bracket' : 'Generate Bracket'}
                    </button>
                  )}
                </div>

                {rounds.length === 0 ? (
                  <p className="text-xs text-slate-400 rounded-lg border border-slate-800 bg-[#070B16] p-4">
                    Bracket matches will appear here once registration closes or the organizer generates the bracket tree.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rounds.map(([roundNum, group]) => (
                      <div key={roundNum} className="space-y-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                          {group.roundName}
                        </p>
                        {group.matches.map((m) => {
                          const canScore =
                            Boolean(m.participantAId && m.participantBId) &&
                            (canManage ||
                              (user &&
                                (m.participantAId === user.userId || m.participantBId === user.userId)));

                          return (
                            <div
                              key={m.id}
                              className="rounded-lg border border-slate-800 bg-[#070B16] p-3.5 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyMatchId(m.id)}
                                  title="Copy Match ID"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-blue-300 hover:text-white"
                                >
                                  <span>{m.id}</span>
                                  {copiedId === m.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-500" aria-hidden="true" />
                                  )}
                                </button>
                                <span className="capitalize font-mono text-[11px] text-slate-400">
                                  {m.status.replace('_', ' ')}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div
                                  className={`flex items-center justify-between rounded px-2 py-1 ${
                                    m.winnerId && m.winnerId === m.participantAId
                                      ? 'bg-emerald-950/40 text-emerald-200 font-semibold'
                                      : 'bg-[#0B1120] text-slate-200'
                                  }`}
                                >
                                  <span>{m.participantAName}</span>
                                  <span className="font-mono tabular-nums">
                                    {m.scoreA !== null ? m.scoreA : '—'}
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center justify-between rounded px-2 py-1 ${
                                    m.winnerId && m.winnerId === m.participantBId
                                      ? 'bg-emerald-950/40 text-emerald-200 font-semibold'
                                      : 'bg-[#0B1120] text-slate-200'
                                  }`}
                                >
                                  <span>{m.participantBName}</span>
                                  <span className="font-mono tabular-nums">
                                    {m.scoreB !== null ? m.scoreB : '—'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                                <span>Server: {m.serverRegion}</span>
                                <div className="flex items-center gap-2">
                                  {canScore && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScoreTarget(m);
                                        setScoreA(m.scoreA !== null ? String(m.scoreA) : '2');
                                        setScoreB(m.scoreB !== null ? String(m.scoreB) : '0');
                                      }}
                                      className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                                    >
                                      {m.status === 'completed' ? 'Edit Score' : 'Report Score'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!user) navigate('auth', { authMode: 'login' });
                                      else setDisputeMatch(m);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 hover:border-rose-500/60 text-slate-300 hover:text-rose-300"
                                  >
                                    <Flag className="w-3 h-3" aria-hidden="true" />
                                    <span>Dispute</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registered Participants */}
              <div>
                <p className="text-xs font-semibold text-white flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    <span>
                      Registered Roster ({detail?.participants.length || 0} / {activeT.maxParticipants})
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400 tabular-nums">
                    {activeT.checkedInCount ?? 0} checked in
                  </span>
                </p>
                {(detail?.participants || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No teams registered yet. Be the first to enter.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detail?.participants.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-800 bg-[#070B16] px-3 py-2 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-white">@{p.username}</span>
                          <span className="text-slate-400"> · {p.teamName} ({p.inGameId})</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.idVerifiedStatus === 'verified' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-label="ID Verified" />
                          )}
                          {p.checkedIn && (
                            <span className="rounded px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold">
                              Checked In
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Organizer Management Controls */}
              {canManage && (
                <form onSubmit={handleUpdateTournament} className="border-t border-slate-800 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-violet-300">Organizer Controls</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value as any)}
                      className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                    >
                      <option value="open">Open</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input
                      type="text"
                      value={resultsInput}
                      onChange={(e) => setResultsInput(e.target.value)}
                      placeholder="Publish final standings / results..."
                      className="sm:col-span-2 rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkInOpenInput}
                      onChange={(e) => setCheckInOpenInput(e.target.checked)}
                    />
                    <span>Player Check-In Window Open</span>
                  </label>
                  <div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white"
                    >
                      Save Tournament Updates
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Match Score Modal */}
      {scoreTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitScore} className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0B1120] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">
              Report Score · {scoreTarget.id}
            </h2>
            <p className="text-xs text-slate-400">
              {scoreTarget.roundName} — Winning advances automatically to the next bracket round and awards Rank Points.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">{scoreTarget.participantAName}</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  required
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">{scoreTarget.participantBName}</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  required
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScoreTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white"
              >
                Submit Official Score
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Match Dispute / Moderation Report Modal */}
      {disputeMatch && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleFileMatchDispute} className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0B1120] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">
              Dispute Match · {disputeMatch.id}
            </h2>
            <p className="text-xs text-slate-400">
              Your report enters GameBridge’s accountable Report → Ask → Decide → Appeal pipeline.
            </p>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Dispute Category</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              >
                <option value="Score / Result Discrepancy">Score / Result Discrepancy</option>
                <option value="Opponent No-Show / Check-In">Opponent No-Show / Check-In</option>
                <option value="Suspected Smurf / Unverified Roster">Suspected Smurf / Unverified Roster</option>
                <option value="Lag / Wrong Server Region">Lag / Wrong Server Region</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Evidence & Match Details</label>
              <textarea
                rows={3}
                required
                minLength={8}
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                placeholder="Describe what happened, final round score, or link to scoreboard screenshot..."
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisputeMatch(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Submit Dispute
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreate && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTournament}
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#0B1120] p-6 space-y-3"
          >
            <h2 className="font-display text-lg font-bold text-white">Create Tournament</h2>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Tournament Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Addis Ababa Winter Open"
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Game</label>
                <select
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                >
                  <option value="Valorant">Valorant</option>
                  <option value="EA FC 25">EA FC 25</option>
                  <option value="PUBG Mobile">PUBG Mobile</option>
                  <option value="Counter-Strike 2">Counter-Strike 2</option>
                  <option value="Tekken 8">Tekken 8</option>
                  <option value="Dota 2">Dota 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Format</label>
                <input
                  type="text"
                  required
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Region</label>
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Prize Pool</label>
                <input
                  type="text"
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Max Slots</label>
                <input
                  type="number"
                  min={4}
                  max={256}
                  value={newMax}
                  onChange={(e) => setNewMax(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Zero-Fee Prize Payout Method</label>
              <input
                type="text"
                value={newPayoutRail}
                onChange={(e) => setNewPayoutRail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Registration Deadline</label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Schedule Summary</label>
              <input
                type="text"
                value={newSchedule}
                onChange={(e) => setNewSchedule(e.target.value)}
                placeholder="Qualifiers Saturday 16:00 EAT, Finals Sunday..."
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Rules Summary</label>
              <textarea
                rows={2}
                value={newRules}
                onChange={(e) => setNewRules(e.target.value)}
                placeholder="Check-in 30 mins prior, anti-cheat enabled..."
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
              >
                Submit Tournament
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
