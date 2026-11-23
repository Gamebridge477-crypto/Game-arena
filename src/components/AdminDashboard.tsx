import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Shield, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';
import type {
  AnalyticsSummary,
  Community,
  IdVerificationStatus,
  OrganizationItem,
  PlatformStats,
  PrizeEscrowStatus,
  ReportItem,
  Tournament,
} from '../shared/types';

interface AdminUserRow {
  userId: string;
  email: string;
  role: 'gamer' | 'organizer' | 'admin';
  status: 'active' | 'suspended';
  fullName: string;
  username: string;
  country: string;
  city: string;
  gamingPlatform: string;
  idVerifiedStatus: IdVerificationStatus;
}

interface AdminOverviewResponse {
  stats: PlatformStats;
  analytics: AnalyticsSummary;
  users: AdminUserRow[];
  tournaments: Tournament[];
  communities: Community[];
  reports: ReportItem[];
  organizations: OrganizationItem[];
}

export function AdminDashboard() {
  const { user, navigate } = useAuth();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [tab, setTab] = useState<'tournaments' | 'reports' | 'orgs' | 'users' | 'communities'>('tournaments');

  // Inline moderation inputs per report ID
  const [askPrompts, setAskPrompts] = useState<Record<string, string>>({});
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAdmin = useCallback(async () => {
    try {
      const res = await apiRequest<AdminOverviewResponse>('/api/admin/overview');
      setData(res);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Unable to load admin console.');
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdmin();
    }
  }, [user, loadAdmin]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <Shield className="w-10 h-10 text-violet-400 mx-auto" aria-hidden="true" />
        <h1 className="font-display text-2xl font-bold text-white">Admin Access Required</h1>
        <p className="text-sm text-slate-400">
          This dashboard is restricted to GameBridge administrators.
        </p>
        <button
          type="button"
          onClick={() => navigate('auth', { authMode: 'login' })}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-xs font-semibold text-white"
        >
          Log In as Admin
        </button>
      </div>
    );
  }

  const updateTournament = async (
    id: string,
    patch: { status?: 'open' | 'rejected' | 'completed'; prizeEscrowStatus?: PrizeEscrowStatus }
  ) => {
    await apiRequest(`/api/admin/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setFeedback('Tournament governance status updated.');
    loadAdmin();
  };

  const handleAskReport = async (id: string) => {
    const prompt = askPrompts[id] || '';
    setErrorMsg(null);
    try {
      await apiRequest(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'ask', clarificationPrompt: prompt }),
      });
      setAskPrompts((prev) => ({ ...prev, [id]: '' }));
      setFeedback('Clarification request sent to reporter.');
      loadAdmin();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not send clarification question.');
    }
  };

  const handleDecideReport = async (id: string, status: 'action_taken' | 'dismissed') => {
    const decisionNote = decisionNotes[id] || '';
    setErrorMsg(null);
    try {
      await apiRequest(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, decisionNote }),
      });
      setFeedback(`Report decision recorded (${status.replace('_', ' ')}).`);
      loadAdmin();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not update report.');
    }
  };

  const handleResolveAppeal = async (id: string, appealStatus: 'upheld' | 'overturned') => {
    const decisionNote = decisionNotes[id] || '';
    setErrorMsg(null);
    try {
      await apiRequest(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resolve_appeal', appealStatus, decisionNote }),
      });
      setFeedback(`Appeal resolved (${appealStatus}).`);
      loadAdmin();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not resolve appeal.');
    }
  };

  const updateOrg = async (id: string, verifiedStatus: 'verified' | 'rejected') => {
    await apiRequest(`/api/admin/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ verifiedStatus }),
    });
    setFeedback(`Organization status updated to ${verifiedStatus}.`);
    loadAdmin();
  };

  const updateUser = async (id: string, patch: { role?: string; status?: string }) => {
    try {
      await apiRequest(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setFeedback('User account updated.');
      loadAdmin();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not update user.');
    }
  };

  const updateCommunity = async (id: string, status: 'active' | 'suspended') => {
    await apiRequest(`/api/admin/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setFeedback(`Community set to ${status}.`);
    loadAdmin();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <p className="text-xs font-medium text-violet-400">Operations, Governance & Telemetry</p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review tournament escrow, execute Report → Ask → Decide → Appeal workflows, verify sponsors, and monitor privacy-safe product analytics.
        </p>
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

      {/* Platform Stats */}
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {[
              { label: 'Users', val: data.stats.totalUsers },
              { label: 'ID Verified', val: data.stats.verifiedPlayers },
              { label: 'Tournaments', val: data.stats.totalTournaments },
              { label: 'Pending Trn', val: data.stats.pendingTournaments },
              { label: 'Registrations', val: data.stats.totalRegistrations },
              { label: 'Communities', val: data.stats.totalCommunities },
              { label: 'Opportunities', val: data.stats.totalOpportunities },
              { label: 'Pending Orgs', val: data.stats.pendingOrgs },
              { label: 'Open Disputes', val: data.stats.openReports },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-800 bg-[#0B1120] p-3.5">
                <p className="text-[11px] text-slate-400">{s.label}</p>
                <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">{s.val}</p>
              </div>
            ))}
          </div>

          {/* Privacy-Safe Product Analytics Strip (Admin Only) */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-3">
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span>Aggregate Product Analytics (Privacy-Safe, No PII)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-[#070B16] p-3">
                <span className="text-slate-400">Total Events</span>
                <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                  {data.analytics.totalEvents}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070B16] p-3">
                <span className="text-slate-400">Page Views</span>
                <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                  {data.analytics.pageViews}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070B16] p-3">
                <span className="text-slate-400">Speed Tests Run</span>
                <p className="mt-1 font-mono text-lg font-bold text-blue-400 tabular-nums">
                  {data.analytics.speedTestsRun}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070B16] p-3">
                <span className="text-slate-400">Tournament Entries</span>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400 tabular-nums">
                  {data.analytics.tournamentRegistrations}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#070B16] p-3">
                <span className="text-slate-400">Match Invites</span>
                <p className="mt-1 font-mono text-lg font-bold text-violet-400 tabular-nums">
                  {data.analytics.matchInvitesSent}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#0B1120] border border-slate-800 w-fit">
        {[
          { key: 'tournaments', label: 'Tournaments & Escrow' },
          { key: 'reports', label: 'Moderation & Appeals' },
          { key: 'orgs', label: 'Organizations' },
          { key: 'users', label: 'Users' },
          { key: 'communities', label: 'Communities' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as any)}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              tab === t.key ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data && (
        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 overflow-x-auto">
          {tab === 'tournaments' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Tournament</th>
                  <th className="pb-2.5 font-medium">Game</th>
                  <th className="pb-2.5 font-medium">Organizer</th>
                  <th className="pb-2.5 font-medium">Prize Escrow</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.tournaments.map((t) => (
                  <tr key={t.id} className="h-12">
                    <td className="pr-3 font-medium text-white">{t.title}</td>
                    <td className="px-3 text-slate-300">{t.gameTitle}</td>
                    <td className="px-3 text-slate-400">@{t.organizerName}</td>
                    <td className="px-3">
                      <select
                        aria-label={`Escrow status for ${t.title}`}
                        value={t.prizeEscrowStatus}
                        onChange={(e) =>
                          updateTournament(t.id, { prizeEscrowStatus: e.target.value as PrizeEscrowStatus })
                        }
                        className="rounded border border-slate-700 bg-[#060A14] px-2 py-1 text-xs text-white"
                      >
                        <option value="pledged">Pledged</option>
                        <option value="verified_escrow">Verified Escrow</option>
                        <option value="disbursed">Disbursed</option>
                      </select>
                    </td>
                    <td className="px-3 capitalize text-blue-400">{t.status.replace('_', ' ')}</td>
                    <td className="pl-3 text-right space-x-2 whitespace-nowrap">
                      {t.status === 'pending_approval' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateTournament(t.id, { status: 'open' })}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTournament(t.id, { status: 'rejected' })}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-500">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'reports' && (
            <div className="space-y-4">
              {data.reports.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-800 bg-[#070B16] p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-white">{r.targetLabel}</span>
                      <span className="text-slate-400"> ({r.targetType})</span>
                      {r.matchId && (
                        <span className="ml-2 font-mono text-blue-400">Match ID: {r.matchId}</span>
                      )}
                      <span className="ml-2 text-slate-400">· Reported by @{r.reporterUsername}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize rounded px-2 py-0.5 bg-amber-950/50 border border-amber-500/30 text-amber-300">
                        {r.status.replace('_', ' ')}
                      </span>
                      {r.appealStatus !== 'none' && (
                        <span className="capitalize rounded px-2 py-0.5 bg-violet-950/50 border border-violet-500/30 text-violet-300">
                          Appeal: {r.appealStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300">
                    <strong>{r.reason}:</strong> {r.details}
                  </p>
                  {r.clarificationPrompt && (
                    <p className="text-blue-300">
                      <strong>Moderator Ask:</strong> {r.clarificationPrompt}
                    </p>
                  )}
                  {r.responseNote && (
                    <p className="text-emerald-300">
                      <strong>Reporter Response:</strong> {r.responseNote}
                    </p>
                  )}
                  {r.decisionNote && (
                    <p className="text-slate-200">
                      <strong>Decision Note:</strong> {r.decisionNote}
                    </p>
                  )}
                  {r.appealReason && (
                    <p className="text-violet-300">
                      <strong>User Appeal:</strong> {r.appealReason}
                    </p>
                  )}

                  {/* Ask stage */}
                  {(r.status === 'open' || r.status === 'awaiting_response') && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={askPrompts[r.id] || ''}
                        onChange={(e) => setAskPrompts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Ask reporter for evidence / screenshot (Ask step)..."
                        className="flex-1 rounded-lg border border-slate-700 bg-[#060A14] px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAskReport(r.id)}
                        className="px-3 py-1.5 rounded-lg border border-blue-500/50 text-blue-300 hover:bg-blue-950/40 font-semibold shrink-0"
                      >
                        Send Ask Prompt
                      </button>
                    </div>
                  )}

                  {/* Decide & Appeal Resolution */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={decisionNotes[r.id] || ''}
                      onChange={(e) => setDecisionNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Decision rationale note..."
                      className="flex-1 rounded-lg border border-slate-700 bg-[#060A14] px-3 py-1.5 text-xs text-white"
                    />
                    <div className="flex flex-wrap gap-2">
                      {(r.status === 'open' || r.status === 'awaiting_response' || r.status === 'reviewed') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDecideReport(r.id, 'action_taken')}
                            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                          >
                            Take Action
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideReport(r.id, 'dismissed')}
                            className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:border-slate-500"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {r.appealStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResolveAppeal(r.id, 'upheld')}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            Uphold Ruling
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveAppeal(r.id, 'overturned')}
                            className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                          >
                            Overturn Ruling
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'orgs' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Organization</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Location</th>
                  <th className="pb-2.5 font-medium">Verification</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.organizations.map((o) => (
                  <tr key={o.id} className="h-12">
                    <td className="pr-3 font-medium text-white">{o.name}</td>
                    <td className="px-3 capitalize text-slate-300">{o.orgType}</td>
                    <td className="px-3 text-slate-400">{o.city || o.country}</td>
                    <td className="px-3 capitalize text-blue-400">{o.verifiedStatus}</td>
                    <td className="pl-3 text-right space-x-2 whitespace-nowrap">
                      {o.verifiedStatus !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => updateOrg(o.id, 'verified')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        >
                          Verify
                        </button>
                      )}
                      {o.verifiedStatus !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => updateOrg(o.id, 'rejected')}
                          className="px-2.5 py-1 rounded border border-slate-700 text-slate-300"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'users' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Username</th>
                  <th className="pb-2.5 font-medium">ID Status</th>
                  <th className="pb-2.5 font-medium">Location</th>
                  <th className="pb-2.5 font-medium">Role</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.users.map((u) => (
                  <tr key={u.userId} className="h-12">
                    <td className="pr-3 font-medium text-white">@{u.username}</td>
                    <td className="px-3">
                      {u.idVerifiedStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-500 capitalize">{u.idVerifiedStatus}</span>
                      )}
                    </td>
                    <td className="px-3 text-slate-400">{u.city ? `${u.city}, ` : ''}{u.country}</td>
                    <td className="px-3">
                      <select
                        aria-label={`Role for ${u.username}`}
                        value={u.role}
                        onChange={(e) => updateUser(u.userId, { role: e.target.value })}
                        className="rounded border border-slate-700 bg-[#060A14] px-2 py-1 text-xs text-white"
                      >
                        <option value="gamer">Gamer</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 capitalize text-slate-300">{u.status}</td>
                    <td className="pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          updateUser(u.userId, {
                            status: u.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          u.status === 'active'
                            ? 'border border-rose-500/40 text-rose-300 hover:bg-rose-950/40'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'communities' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Community</th>
                  <th className="pb-2.5 font-medium">Focus</th>
                  <th className="pb-2.5 font-medium">Members</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.communities.map((c) => (
                  <tr key={c.id} className="h-12">
                    <td className="pr-3 font-medium text-white">{c.name}</td>
                    <td className="px-3 text-slate-300">{c.gameFocus}</td>
                    <td className="px-3 font-mono tabular-nums text-slate-300">{c.memberCount}</td>
                    <td className="px-3 capitalize text-blue-400">{c.status}</td>
                    <td className="pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          updateCommunity(c.id, c.status === 'active' ? 'suspended' : 'active')
                        }
                        className="px-2.5 py-1 rounded border border-slate-700 text-slate-300 hover:border-slate-500"
                      >
                        {c.status === 'active' ? 'Suspend' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
