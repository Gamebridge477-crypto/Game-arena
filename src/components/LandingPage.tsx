import { useEffect, useState } from 'react';
import { ArrowRight, Globe, MapPin, Trophy, Users, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocaleTheme } from '../context/LocaleThemeContext';
import { apiRequest } from '../lib/api';
import { formatExplicitDate } from '../shared/logic';
import type { Community, GameItem, Tournament } from '../shared/types';
import heroArenaImg from '../assets/images/hero_esports_arena_1794620721433.jpg';
import communityHubImg from '../assets/images/community_gaming_hub_1794620722526.jpg';

interface OverviewResponse {
  stats: {
    totalPlayers: number;
    totalTournaments: number;
    totalCommunities: number;
    totalOpportunities: number;
  };
  games: GameItem[];
  featuredTournaments: Tournament[];
  featuredCommunities: Community[];
}

export function LandingPage() {
  const { user, navigate } = useAuth();
  const { t } = useLocaleTheme();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    apiRequest<OverviewResponse>('/api/overview')
      .then(setOverview)
      .catch(() => {});
  }, []);

  const challenges = [
    {
      num: '01',
      title: 'Connection Quality Diagnostics',
      desc: 'Test real download, upload, ping, and jitter estimates before queued qualifiers and see which regional relay servers fit your ISP.',
      actionLabel: 'Run Speed Check',
      target: 'connection' as const,
    },
    {
      num: '02',
      title: 'Structured Teammate Matchmaking',
      desc: 'Filter players by game title, platform, city, language, availability, and playstyle without noisy group chats.',
      actionLabel: 'Find Players',
      target: 'players' as const,
    },
    {
      num: '03',
      title: 'Organized Regional Brackets',
      desc: 'Verified single-elimination match trees with deterministic Match IDs, check-in lock, and live score propagation.',
      actionLabel: 'Browse Tournaments',
      target: 'tournaments' as const,
    },
    {
      num: '04',
      title: 'Equipment & Gaming Hub Access',
      desc: 'Locate partner fiber lounges, LAN bootcamps, and equipment access programs in Addis Ababa, Hawassa, and Adama.',
      actionLabel: 'View Opportunities',
      target: 'opportunities' as const,
    },
    {
      num: '05',
      title: 'Sponsorship & Career Pathways',
      desc: 'Connect directly with verified sponsors, clubs, scouting rosters, and observer/referee fellowships.',
      actionLabel: 'Explore Sponsorships',
      target: 'opportunities' as const,
    },
    {
      num: '06',
      title: 'Moderated Communities & Rankings',
      desc: 'Join city clubs, track verified player rankings, and rely on accountable Report → Ask → Decide → Appeal governance.',
      actionLabel: 'View Rankings',
      target: 'rankings' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#060A14]">
      {/* Hero Section */}
      <section className="border-b border-slate-800/80 bg-[#070B16]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-wider text-blue-400">
                {t('hero.eyebrow')}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]">
                {t('hero.title')}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {t('hero.desc')}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('explore')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>{t('hero.ctaExplore')}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    user ? navigate('communities') : navigate('auth', { authMode: 'signup' })
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 bg-[#0B1120] hover:border-slate-500 text-sm font-semibold text-slate-100 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>{user ? t('hero.ctaCommunities') : t('hero.ctaJoin')}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">{t('hero.tagline')}</p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] lg:min-h-[380px] overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120]">
                {!heroImgFailed ? (
                  <img
                    src={heroArenaImg}
                    alt="Ethiopian competitive gamers competing at a modern dark-navy esports arena"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0B1224] via-[#0F172A] to-[#1E1B4B] p-8 text-center">
                    <Trophy className="w-12 h-12 text-blue-400 mb-3" aria-hidden="true" />
                    <p className="font-display text-lg font-semibold text-white">
                      Addis Ababa & East Africa Arena Network
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060A14]/90 via-[#060A14]/25 to-transparent" />
                <div
                  className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs"
                  style={{ color: '#F1F5F9' }}
                >
                  <span>Addis Ababa · Hawassa · Adama · Nairobi · Lagos</span>
                  <span className="font-mono tabular-nums" style={{ color: '#93C5FD' }}>
                    Live Ecosystem Hub
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column Ecosystem Stats Strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-800/80 pt-8">
            <div className="rounded-xl border border-slate-800/90 bg-[#0B1120] p-5">
              <p className="text-xs font-medium text-slate-400">Registered Gamers & Hosts</p>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                {overview ? overview.stats.totalPlayers : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Fayda-ready player profiles</p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#0B1120] p-5">
              <p className="text-xs font-medium text-slate-400">Active & Completed Brackets</p>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                {overview ? overview.stats.totalTournaments : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Ethiopian & regional cups</p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#0B1120] p-5">
              <p className="text-xs font-medium text-slate-400">Gaming Clubs & Guilds</p>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                {overview ? overview.stats.totalCommunities : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">City & campus communities</p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#0B1120] p-5">
              <p className="text-xs font-medium text-slate-400">Open Opportunities</p>
              <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                {overview ? overview.stats.totalOpportunities : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Sponsors, gear & careers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {t('landing.featuredTournaments')}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{t('landing.featuredTournamentsSub')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('tournaments')}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>{t('landing.viewAllTournaments')}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(overview?.featuredTournaments || []).map((trn) => (
            <div
              key={trn.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B1120] p-6 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-blue-400 font-medium">{trn.gameTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{trn.format}</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">{trn.title}</h3>
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                  <span>{trn.region}</span>
                </p>
                <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Prize Pool</span>
                    <span className="font-medium text-slate-100 text-right">{trn.prizePool}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Slots</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {trn.registeredCount} / {trn.maxParticipants}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Deadline</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {formatExplicitDate(trn.registrationDeadline)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('tournaments', { tournamentId: trn.id })}
                className="mt-6 w-full py-2.5 px-4 rounded-lg bg-slate-800/90 hover:bg-blue-600 text-xs font-semibold text-white transition-colors min-h-[40px]"
              >
                {t('landing.viewBracketRegister')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Games */}
      <section className="border-y border-slate-800/80 bg-[#080D1B]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t('landing.popularGames')}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{t('landing.popularGamesSub')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('players')}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>{t('landing.matchmakeByGame')}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(overview?.games || []).map((game) => (
              <div
                key={game.id}
                className="rounded-xl border border-slate-800 bg-[#0B1120] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-white">{game.title}</h3>
                    <span className="font-mono text-xs tabular-nums text-blue-400">
                      {game.activePlayersCount} active
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {game.genre} · {game.platforms.join(', ')}
                  </p>
                </div>
                <p className="mt-4 pt-3 border-t border-slate-800/70 text-xs text-slate-400">
                  Servers: {game.regionServers}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t('landing.barriersTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{t('landing.barriersSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((item) => (
            <div
              key={item.num}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B1120] p-6"
            >
              <div>
                <p className="font-mono text-xs font-medium text-violet-400">{item.num}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(item.target)}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 whitespace-nowrap shrink-0"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Gaming Communities Showcase */}
      <section className="border-t border-slate-800/80 bg-[#080D1B]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120] aspect-[4/3]">
                <img
                  src={communityHubImg}
                  alt="East African gamers collaborating in a community gaming hub"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7 space-y-5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t('landing.communitiesTitle')}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                From campus guilds in Hawassa and Adama to competitive FPS rosters in Addis Ababa, GameBridge gives clubs structured announcements, scrim scheduling, and moderation tools.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(overview?.featuredCommunities || []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate('communities')}
                    className="text-left rounded-xl border border-slate-800 bg-[#0B1120] p-4 hover:border-blue-500/60 transition-colors"
                  >
                    <p className="font-display text-sm font-semibold text-white">{c.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.gameFocus} · {c.city || c.region}
                    </p>
                    <p className="mt-2 font-mono text-xs tabular-nums text-blue-400">
                      {c.memberCount} members
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {t('landing.aboutTitle')}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              GameBridge is an esports ecosystem platform built first for Ethiopia and designed to scale across Africa. We connect individual competitors, university clubs, LAN lounges, tournament organizers, and sponsors inside one accountable, free-to-use digital network.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              By pairing player matchmaking, verified identity hashing, and live brackets with real connection diagnostics and equipment access programs, GameBridge turns fragmented casual play into structured competitive pathways.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(user ? 'dashboard' : 'auth', { authMode: 'signup' })}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors min-h-[40px]"
              >
                {user ? 'Go to Dashboard' : 'Create Free Account'}
              </button>
              <button
                type="button"
                onClick={() => navigate('connection')}
                className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition-colors min-h-[40px]"
              >
                Test Connection Quality
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-[#070B16] p-4">
              <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">Ethiopia-First, Africa-Wide</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Localized cities, university hubs, and cross-border East African scrims.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-[#070B16] p-4">
              <Wifi className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">Transparent Network Estimates</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Built-in latency, jitter, download, and upload diagnostics before matches.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-[#070B16] p-4">
              <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">Zero Paywalls & Escrow Transparency</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All matchmaking, community hosting, and tournament brackets remain free for players.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer with Legal & Fair-Play Links */}
      <footer className="border-t border-slate-800/80 bg-[#050811]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-bold text-white">GameBridge</p>
            <p className="mt-1 text-xs text-slate-400">
              Connecting Gamers. Building Opportunities. Powering African Esports.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-slate-400">
            <button type="button" onClick={() => navigate('tournaments')} className="hover:text-white">
              Tournaments
            </button>
            <button type="button" onClick={() => navigate('rankings')} className="hover:text-white">
              Rankings
            </button>
            <button type="button" onClick={() => navigate('players')} className="hover:text-white">
              Find Players
            </button>
            <button type="button" onClick={() => navigate('connection')} className="hover:text-white">
              Connection Checker
            </button>
            <button type="button" onClick={() => navigate('opportunities')} className="hover:text-white">
              Opportunities
            </button>
            <button
              type="button"
              onClick={() => navigate('legal', { legalTab: 'fairplay' })}
              className="hover:text-white"
            >
              Fair-Play Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('legal', { legalTab: 'youth' })}
              className="hover:text-white"
            >
              Under-18 Consent
            </button>
            <button
              type="button"
              onClick={() => navigate('legal', { legalTab: 'privacy' })}
              className="hover:text-white"
            >
              Privacy & Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
