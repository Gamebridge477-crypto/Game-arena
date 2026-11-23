import { useCallback, useEffect, useState } from 'react';
import { Award, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocaleTheme } from '../context/LocaleThemeContext';
import { apiRequest } from '../lib/api';
import type { RankingEntry } from '../shared/types';

export function RankingsPage() {
  const { navigate } = useAuth();
  const { t } = useLocaleTheme();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const loadRankings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (gameFilter !== 'All') params.set('game', gameFilter);
    if (regionFilter !== 'All') params.set('region', regionFilter);
    try {
      const data = await apiRequest<{ rankings: RankingEntry[] }>(`/api/rankings?${params.toString()}`);
      setRankings(data.rankings);
    } catch {
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, [gameFilter, regionFilter]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-blue-400">{t('rankings.eyebrow')}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('rankings.title')}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">{t('rankings.subtitle')}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 shrink-0 text-xs">
          <div className="rounded-lg border border-slate-800 bg-[#070B16] px-4 py-3">
            <p className="text-slate-400">Match Win</p>
            <p className="mt-1 font-mono text-base font-bold text-emerald-400 tabular-nums">+25 pts</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#070B16] px-4 py-3">
            <p className="text-slate-400">Match Played</p>
            <p className="mt-1 font-mono text-base font-bold text-blue-400 tabular-nums">+10 pts</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#070B16] px-4 py-3">
            <p className="text-slate-400">Cup Title</p>
            <p className="mt-1 font-mono text-base font-bold text-violet-400 tabular-nums">+100 pts</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          aria-label="Filter rankings by game"
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white min-h-[40px]"
        >
          <option value="All">All Games</option>
          <option value="Valorant">Valorant</option>
          <option value="EA FC 25">EA FC 25</option>
          <option value="PUBG Mobile">PUBG Mobile</option>
          <option value="Counter-Strike 2">Counter-Strike 2</option>
          <option value="Tekken 8">Tekken 8</option>
          <option value="Dota 2">Dota 2</option>
        </select>
        <select
          aria-label="Filter rankings by region"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#060A14] px-3 py-2 text-xs text-white min-h-[40px]"
        >
          <option value="All">All Regions</option>
          <option value="Ethiopia">Ethiopia (All Cities)</option>
          <option value="Addis Ababa">Addis Ababa</option>
          <option value="Hawassa">Hawassa</option>
          <option value="Adama">Adama</option>
          <option value="Kenya">Kenya</option>
          <option value="Nigeria">Nigeria</option>
        </select>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1120] overflow-x-auto">
        {loading ? (
          <div className="h-64 animate-pulse" />
        ) : rankings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No ranked players match your current filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3.5 px-4 font-medium">Rank</th>
                <th className="py-3.5 px-4 font-medium">Competitor</th>
                <th className="py-3.5 px-4 font-medium">Location & Platform</th>
                <th className="py-3.5 px-4 font-medium">Primary Games</th>
                <th className="py-3.5 px-4 font-medium text-right">Record</th>
                <th className="py-3.5 px-4 font-medium text-right">Win Rate</th>
                <th className="py-3.5 px-4 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {rankings.map((r) => (
                <tr key={r.userId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white tabular-nums">
                    {r.rank <= 3 ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-400">
                        <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                        #{r.rank}
                      </span>
                    ) : (
                      `#${r.rank}`
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('profile', { username: r.username })}
                        className="font-semibold text-white hover:text-blue-400 text-left"
                      >
                        @{r.username}
                      </button>
                      {r.idVerifiedStatus === 'verified' && (
                        <span
                          title="Fayda / National ID Hash Verified"
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300"
                        >
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{r.fullName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {r.city ? `${r.city}, ` : ''}
                    {r.country} · <span className="text-slate-400">{r.gamingPlatform}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {r.favoriteGames.slice(0, 3).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                    {r.wins}W / {r.matchesPlayed}M
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-400">
                    {r.winRate}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-white">
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
                      {r.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
