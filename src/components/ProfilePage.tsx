import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  BellRing,
  Check,
  Edit3,
  MessageSquareWarning,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiRequest } from '../lib/api';
import { formatExplicitDate } from '../shared/logic';
import type { PublicProfile, ReportItem } from '../shared/types';

interface ProfileResponse {
  profile: PublicProfile;
  communities: { id: string; name: string; gameFocus: string; city: string; role: string }[];
  tournaments: { id: string; title: string; gameTitle: string; startDate: string; status: string; teamName: string }[];
}

const ALL_GAMES = ['Valorant', 'EA FC 25', 'PUBG Mobile', 'Counter-Strike 2', 'Tekken 8', 'Dota 2'];

export function ProfilePage() {
  const { user, selectedUsername, navigate, refreshUser } = useAuth();
  const targetUsername = selectedUsername || user?.username || null;

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [gamingPlatform, setGamingPlatform] = useState('PC');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [availability, setAvailability] = useState('');
  const [gamingStyle, setGamingStyle] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Identity Hash Binding
  const [idType, setIdType] = useState('Fayda FAN');
  const [idCode, setIdCode] = useState('');

  // Telegram, Channels & Under-18 Guardian Consent
  const [telegramHandle, setTelegramHandle] = useState('');
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [isUnder18, setIsUnder18] = useState(false);
  const [guardianName, setGuardianName] = useState('');

  // Report Ask-Response & Appeal inputs keyed by report id
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [appealNotes, setAppealNotes] = useState<Record<string, string>>({});

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!targetUsername) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<ProfileResponse>(`/api/profile/${encodeURIComponent(targetUsername)}`);
      setData(res);
      setFullName(res.profile.fullName);
      setCountry(res.profile.country);
      setCity(res.profile.city);
      setGamingPlatform(res.profile.gamingPlatform);
      setExperienceLevel(res.profile.experienceLevel);
      setPreferredLanguage(res.profile.preferredLanguage);
      setAvailability(res.profile.availability);
      setGamingStyle(res.profile.gamingStyle);
      setBio(res.profile.bio);
      setFavoriteGames(res.profile.favoriteGames);
      setAvatarUrl(res.profile.avatarUrl);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [targetUsername]);

  const loadMyReports = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest<{ reports: ReportItem[] }>('/api/reports/mine');
      setMyReports(res.reports);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (user) {
      setTelegramHandle(user.telegramHandle || '');
      setNotifyTelegram(user.notifyTelegram);
      setNotifyEmail(user.notifyEmail);
      setNotifyPush(user.notifyPush);
      setIsUnder18(user.isUnder18);
      setGuardianName(user.guardianName || '');
      loadMyReports();
    }
  }, [user, loadMyReports]);

  if (!targetUsername) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Sign in to view your Profile</h1>
        <button
          type="button"
          onClick={() => navigate('auth', { authMode: 'login' })}
          className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-xs font-semibold text-white"
        >
          Log In
        </button>
      </div>
    );
  }

  const isOwnProfile = Boolean(user && data?.profile.userId === user.userId);

  const toggleGame = (g: string) => {
    setFavoriteGames((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          country,
          city,
          gamingPlatform,
          experienceLevel,
          preferredLanguage,
          availability,
          gamingStyle,
          bio,
          favoriteGames,
          avatarUrl,
        }),
      });
      setEditing(false);
      setFeedback('Profile updated.');
      await refreshUser();
      await loadProfile();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Update failed.');
    }
  };

  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiRequest('/api/profile/verify-id', {
        method: 'POST',
        body: JSON.stringify({ idType, idCode }),
      });
      setIdCode('');
      setFeedback(`Identity hash verified via ${idType}. Raw ID discarded securely.`);
      await refreshUser();
      await loadProfile();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Verification failed.');
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await apiRequest('/api/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          telegramHandle,
          notifyTelegram,
          notifyEmail,
          notifyPush,
          isUnder18,
          guardianName,
        }),
      });
      setFeedback('Notification channels & Youth/Guardian consent preferences saved.');
      await refreshUser();
      await loadProfile();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not save preferences.');
    }
  };

  const handleReplyAsk = async (reportId: string) => {
    const responseNote = replyNotes[reportId] || '';
    setErrorMsg(null);
    try {
      await apiRequest(`/api/reports/${reportId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ responseNote }),
      });
      setFeedback('Clarification sent to moderators.');
      setReplyNotes((prev) => ({ ...prev, [reportId]: '' }));
      await loadMyReports();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not submit clarification.');
    }
  };

  const handleSubmitAppeal = async (reportId: string) => {
    const appealReason = appealNotes[reportId] || '';
    setErrorMsg(null);
    try {
      await apiRequest(`/api/reports/${reportId}/appeal`, {
        method: 'POST',
        body: JSON.stringify({ appealReason }),
      });
      setFeedback('Appeal submitted for senior admin review.');
      setAppealNotes((prev) => ({ ...prev, [reportId]: '' }));
      await loadMyReports();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Could not submit appeal.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-64 rounded-xl border border-slate-800 bg-[#0B1120] animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-400">
        Player profile not found.
      </div>
    );
  }

  const p = data.profile;
  const initials = p.fullName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
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

      {/* Profile Header Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={`${p.username} avatar`}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/40 flex items-center justify-center font-display text-2xl font-bold text-white shrink-0">
              {initials}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-blue-400">
              <span className="capitalize">{p.role}</span>
              <span aria-hidden="true">·</span>
              <span>{p.experienceLevel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-violet-300 tabular-nums">{p.points} pts</span>
              {p.idVerifiedStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{p.idVerificationType || 'ID'} Verified</span>
                </span>
              )}
              {p.isUnder18 && (
                <span className="rounded px-2 py-0.5 bg-blue-950/60 border border-blue-500/40 text-[11px] text-blue-300">
                  Youth ({p.parentalConsentStatus})
                </span>
              )}
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">{p.fullName}</h1>
            <p className="text-sm text-slate-300">
              @{p.username} · {p.city ? `${p.city}, ` : ''}{p.country}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {p.gamingPlatform} · {p.preferredLanguage} · {p.availability}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500 text-xs font-semibold text-white shrink-0 min-h-[40px]"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{editing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && isOwnProfile && (
        <form onSubmit={handleSaveProfile} className="rounded-xl border border-blue-500/40 bg-[#0B1120] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Update Profile Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Country</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Gaming Platform</label>
              <select
                value={gamingPlatform}
                onChange={(e) => setGamingPlatform(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              >
                <option value="PC">PC</option>
                <option value="PlayStation 5">PlayStation 5</option>
                <option value="Xbox Series">Xbox Series</option>
                <option value="Mobile">Mobile</option>
                <option value="PC & Console">PC & Console</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Competitive">Competitive</option>
                <option value="Pro">Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Preferred Languages</label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Availability</label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Gaming Style</label>
              <input
                type="text"
                value={gamingStyle}
                onChange={(e) => setGamingStyle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs text-slate-300 mb-1.5">Favorite Games</span>
            <div className="flex flex-wrap gap-2">
              {ALL_GAMES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGame(g)}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    favoriteGames.includes(g)
                      ? 'border-blue-500 bg-blue-600/20 text-white'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Save Changes</span>
          </button>
        </form>
      )}

      {/* Own Profile: ID Verification + Telegram & Youth Preferences */}
      {isOwnProfile && user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleVerifyId} className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Player Identity Hash Binding</span>
              </h2>
              <span
                className={`text-xs font-semibold capitalize ${
                  user.idVerifiedStatus === 'verified' ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {user.idVerifiedStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prevent multi-account smurfing with one unique identity per competitor. GameBridge stores only a salted HMAC-SHA256 hash—never your raw Fayda FAN, Student ID, or phone number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Credential Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                >
                  <option value="Fayda FAN">Fayda FAN (National ID)</option>
                  <option value="Ethiopian Student ID">University / Student ID</option>
                  <option value="Phone OTP">Phone OTP Reference</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">ID / FAN Reference</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                  placeholder="e.g. FAN-88201944"
                  className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
            >
              {user.idVerifiedStatus === 'verified' ? 'Re-Verify Identity Hash' : 'Verify & Bind Identity'}
            </button>
          </form>

          <form onSubmit={handleSavePreferences} className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span>Telegram Alerts & Youth Consent</span>
            </h2>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Telegram Handle</label>
              <input
                type="text"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@your_telegram"
                className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                />
                <span>Telegram Match Alerts</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                />
                <span>Email</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPush}
                  onChange={(e) => setNotifyPush(e.target.checked)}
                />
                <span>Web Push</span>
              </label>
            </div>
            <div className="border-t border-slate-800/80 pt-3 space-y-2.5">
              <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnder18}
                  onChange={(e) => setIsUnder18(e.target.checked)}
                />
                <span>I am under 18 years old (Parental Consent Required)</span>
              </label>
              {isUnder18 && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Parent / Legal Guardian Full Name</label>
                  <input
                    type="text"
                    required={isUnder18}
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Guardian full name for youth prize & venue consent"
                    className="w-full rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
            >
              Save Alert & Consent Settings
            </button>
          </form>
        </div>
      )}

      {/* Own Profile: My Reports, Moderator Asks & Appeals */}
      {isOwnProfile && user && (
        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>My Match Disputes & Moderation Appeals ({myReports.length})</span>
            </h2>
          </div>
          {myReports.length === 0 ? (
            <p className="text-xs text-slate-400">
              No moderation reports or match disputes filed. You can dispute any Match ID from the Tournaments bracket view.
            </p>
          ) : (
            <div className="space-y-4">
              {myReports.map((rep) => (
                <div key={rep.id} className="rounded-lg border border-slate-800 bg-[#070B16] p-4 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-white">
                      {rep.targetLabel}
                      {rep.matchId && (
                        <span className="ml-2 font-mono text-blue-400">[{rep.matchId}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize rounded px-2 py-0.5 bg-amber-950/50 border border-amber-500/30 text-amber-300">
                        {rep.status.replace('_', ' ')}
                      </span>
                      {rep.appealStatus !== 'none' && (
                        <span className="capitalize rounded px-2 py-0.5 bg-violet-950/50 border border-violet-500/30 text-violet-300">
                          Appeal: {rep.appealStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300">
                    <strong>Reason:</strong> {rep.reason} — {rep.details}
                  </p>

                  {/* Ask stage */}
                  {rep.clarificationPrompt && (
                    <div className="rounded border border-blue-500/30 bg-blue-950/20 p-3 space-y-2">
                      <p className="font-semibold text-blue-300">
                        Moderator Question (Ask): {rep.clarificationPrompt}
                      </p>
                      {rep.responseNote ? (
                        <p className="text-slate-200">
                          <strong>Your Response:</strong> {rep.responseNote}
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={replyNotes[rep.id] || ''}
                            onChange={(e) =>
                              setReplyNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                            }
                            placeholder="Reply with match screenshot link or explanation..."
                            className="flex-1 rounded-lg border border-slate-700 bg-[#060A14] px-3 py-1.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplyAsk(rep.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shrink-0"
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decide & Appeal stage */}
                  {rep.decisionNote && (
                    <p className="text-emerald-300">
                      <strong>Moderator Decision:</strong> {rep.decisionNote}
                    </p>
                  )}

                  {(rep.status === 'dismissed' || rep.status === 'action_taken' || rep.status === 'reviewed') &&
                    rep.appealStatus === 'none' && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={appealNotes[rep.id] || ''}
                          onChange={(e) =>
                            setAppealNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                          }
                          placeholder="Reason for appealing this moderation outcome..."
                          className="flex-1 rounded-lg border border-slate-700 bg-[#060A14] px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitAppeal(rep.id)}
                          className="px-3.5 py-1.5 rounded-lg border border-violet-500/50 hover:bg-violet-600/20 text-xs font-semibold text-violet-300 shrink-0"
                        >
                          Submit Appeal
                        </button>
                      </div>
                    )}

                  {rep.appealReason && (
                    <p className="text-violet-300">
                      <strong>Your Appeal:</strong> {rep.appealReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Player Overview</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {p.bio || 'No bio added yet.'}
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
            <p><span className="text-slate-400">Favorite Games:</span> <span className="text-white">{p.favoriteGames.join(', ')}</span></p>
            <p><span className="text-slate-400">Playstyle:</span> <span className="text-white">{p.gamingStyle}</span></p>
            <p><span className="text-slate-400">Match Record:</span> <span className="font-mono tabular-nums text-white">{p.wins}W / {p.matchesPlayed}M ({p.points} pts)</span></p>
          </div>
          {isOwnProfile && user && (
            <p className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              Private account email ({user.email}) is hidden from other users.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" aria-hidden="true" />
            <span>Achievements</span>
          </h2>
          {p.achievements.length === 0 ? (
            <p className="text-xs text-slate-400">Compete in tournaments to earn ecosystem badges.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-200">
              {p.achievements.map((a) => (
                <li key={a} className="rounded-lg border border-slate-800 bg-[#070B16] px-3 py-2">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span>Joined Communities ({data.communities.length})</span>
          </h2>
          {data.communities.length === 0 ? (
            <p className="text-xs text-slate-400">No communities joined yet.</p>
          ) : (
            <div className="space-y-2">
              {data.communities.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-800 bg-[#070B16] px-3 py-2 text-xs">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-slate-400"> · {c.gameFocus} ({c.role})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span>Tournament Participation ({data.tournaments.length})</span>
          </h2>
          {data.tournaments.length === 0 ? (
            <p className="text-xs text-slate-400">No tournament entries yet.</p>
          ) : (
            <div className="space-y-2">
              {data.tournaments.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-800 bg-[#070B16] px-3 py-2 text-xs">
                  <p className="font-semibold text-white">{t.title}</p>
                  <p className="text-slate-400">
                    {t.gameTitle} · Team: {t.teamName} · Starts {formatExplicitDate(t.startDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
