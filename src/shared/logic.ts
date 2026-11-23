import type {
  AuthUser,
  MatchmakingFilters,
  PublicProfile,
  RankingEntry,
  Tournament,
  TournamentMatch,
} from './types';

export interface RegistrationPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  country: string;
  city?: string;
  favoriteGames: string[];
  gamingPlatform: string;
}

export function validateRegistrationInput(
  input: RegistrationPayload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const username = (input.username || '').trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    errors.push('Username must be 3–24 characters using letters, numbers, or underscores.');
  }

  const email = (input.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (!input.password || input.password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (!input.country || input.country.trim().length < 2) {
    errors.push('Country is required.');
  }

  if (!input.gamingPlatform || input.gamingPlatform.trim().length < 2) {
    errors.push('Gaming platform is required.');
  }

  if (!Array.isArray(input.favoriteGames) || input.favoriteGames.length === 0) {
    errors.push('Select at least one favorite game.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Formats ISO dates unambiguously (e.g. "Thu, 10 Dec 2026") so Ethiopian and international
 * users never confuse MM/DD vs DD/MM numeric dates.
 */
export function formatExplicitDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function scoreMatchmakingCandidate(
  viewer: PublicProfile | null,
  candidate: PublicProfile,
  filters: MatchmakingFilters
): { matches: boolean; score: number; reasons: string[] } {
  if (filters.game && filters.game !== 'All') {
    const hasGame = candidate.favoriteGames.some(
      (g) => g.toLowerCase() === filters.game!.toLowerCase()
    );
    if (!hasGame) return { matches: false, score: 0, reasons: [] };
  }

  if (
    filters.platform &&
    filters.platform !== 'All' &&
    candidate.gamingPlatform.toLowerCase() !== filters.platform.toLowerCase()
  ) {
    return { matches: false, score: 0, reasons: [] };
  }

  if (
    filters.experienceLevel &&
    filters.experienceLevel !== 'All' &&
    candidate.experienceLevel.toLowerCase() !== filters.experienceLevel.toLowerCase()
  ) {
    return { matches: false, score: 0, reasons: [] };
  }

  if (
    filters.language &&
    filters.language !== 'All' &&
    !candidate.preferredLanguage.toLowerCase().includes(filters.language.toLowerCase())
  ) {
    return { matches: false, score: 0, reasons: [] };
  }

  if (filters.region && filters.region !== 'All') {
    const regionLower = filters.region.toLowerCase();
    const loc = `${candidate.country} ${candidate.city}`.toLowerCase();
    if (!loc.includes(regionLower)) {
      return { matches: false, score: 0, reasons: [] };
    }
  }

  if (
    filters.availability &&
    filters.availability !== 'All' &&
    !candidate.availability.toLowerCase().includes(filters.availability.toLowerCase())
  ) {
    return { matches: false, score: 0, reasons: [] };
  }

  if (
    filters.gamingStyle &&
    filters.gamingStyle !== 'All' &&
    !candidate.gamingStyle.toLowerCase().includes(filters.gamingStyle.toLowerCase())
  ) {
    return { matches: false, score: 0, reasons: [] };
  }

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    const hay = `${candidate.username} ${candidate.fullName} ${candidate.city} ${candidate.country} ${candidate.favoriteGames.join(' ')} ${candidate.gamingStyle}`.toLowerCase();
    if (!hay.includes(q)) {
      return { matches: false, score: 0, reasons: [] };
    }
  }

  let score = 50;
  const reasons: string[] = [];

  if (viewer) {
    const sharedGames = candidate.favoriteGames.filter((g) =>
      viewer.favoriteGames.some((vg) => vg.toLowerCase() === g.toLowerCase())
    );
    if (sharedGames.length > 0) {
      score += Math.min(25, sharedGames.length * 15);
      reasons.push(`Shared game: ${sharedGames[0]}`);
    }

    if (candidate.gamingPlatform.toLowerCase() === viewer.gamingPlatform.toLowerCase()) {
      score += 10;
      reasons.push(`Same platform (${candidate.gamingPlatform})`);
    }

    if (candidate.country.toLowerCase() === viewer.country.toLowerCase()) {
      score += 10;
      reasons.push(`Same region (${candidate.city || candidate.country})`);
    }

    if (candidate.preferredLanguage.toLowerCase() === viewer.preferredLanguage.toLowerCase()) {
      score += 5;
      reasons.push(`Speaks ${candidate.preferredLanguage}`);
    }
  } else {
    score = 75;
    if (candidate.favoriteGames.length > 0) {
      reasons.push(`Plays ${candidate.favoriteGames.slice(0, 2).join(', ')}`);
    }
    reasons.push(candidate.city ? `${candidate.city}, ${candidate.country}` : candidate.country);
  }

  return {
    matches: true,
    score: Math.min(99, score),
    reasons,
  };
}

export function evaluateConnectionQuality(metrics: {
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
}): {
  stability: 'Excellent' | 'Stable' | 'Playable' | 'Unstable';
  summary: string;
  suitableGenres: string[];
  guidance: string[];
} {
  const { downloadMbps, uploadMbps, pingMs, jitterMs } = metrics;

  if (pingMs <= 45 && jitterMs <= 10 && downloadMbps >= 20 && uploadMbps >= 5) {
    return {
      stability: 'Excellent',
      summary: 'Low latency and minimal jitter suitable for competitive ranked play and tournament qualifiers.',
      suitableGenres: ['Tactical FPS (Valorant, CS2)', 'Fighting Games (Tekken 8)', 'Football (EA FC 25)', 'MOBAs (Dota 2)'],
      guidance: [
        'Use a wired Ethernet connection whenever possible during tournament matches.',
        'Keep background cloud syncs paused during live qualifiers.',
      ],
    };
  }

  if (pingMs <= 85 && jitterMs <= 22 && downloadMbps >= 10 && uploadMbps >= 2) {
    return {
      stability: 'Stable',
      summary: 'Consistent throughput with moderate latency. Works reliably on regional Middle East and European relay nodes.',
      suitableGenres: ['Battle Royale (PUBG Mobile)', 'MOBAs (Dota 2)', 'Football (EA FC 25)', 'Co-op Tactical'],
      guidance: [
        'Select Bahrain, Dubai, or Frankfurt game servers depending on ISP routing.',
        'Avoid competing on crowded public Wi-Fi during peak evening hours (19:00–22:00 EAT).',
      ],
    };
  }

  if (pingMs <= 140 && downloadMbps >= 4) {
    return {
      stability: 'Playable',
      summary: 'Higher round-trip latency or jitter may introduce input delay in twitch shooters and fighting games.',
      suitableGenres: ['Strategy & Turn-Based', 'MOBAs (Casual/Scrims)', 'Mobile Battle Royale'],
      guidance: [
        'Switch to 5GHz Wi-Fi or wired LAN to reduce packet jitter.',
        'Consider local LAN lounges or GameBridge partner hubs for official tournament brackets.',
      ],
    };
  }

  return {
    stability: 'Unstable',
    summary: 'High ping, elevated jitter, or constrained bandwidth detected. Real-time competitive matches may experience rubber-banding.',
    suitableGenres: ['Offline Training & Aim Labs', 'Local LAN Tournaments'],
    guidance: [
      'Close bandwidth-heavy streams or downloads on the same router.',
      'Check GameBridge Opportunities for partner gaming cafes in Addis Ababa, Hawassa, and Adama with fiber access.',
    ],
  };
}

export function canRegisterForTournament(
  tournament: Pick<Tournament, 'status' | 'registrationDeadline' | 'maxParticipants'>,
  registeredCount: number,
  nowIso: string
): { allowed: boolean; reason?: string } {
  if (tournament.status !== 'open') {
    return { allowed: false, reason: 'Registration is only available for open tournaments.' };
  }
  if (registeredCount >= tournament.maxParticipants) {
    return { allowed: false, reason: 'This tournament has reached maximum participant capacity.' };
  }
  if (new Date(nowIso).getTime() > new Date(tournament.registrationDeadline).getTime()) {
    return { allowed: false, reason: 'The registration deadline for this tournament has passed.' };
  }
  return { allowed: true };
}

export function canUserManageTournament(
  user: Pick<AuthUser, 'userId' | 'role'> | null,
  tournament: Pick<Tournament, 'organizerId'>
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.userId === tournament.organizerId;
}

export function sanitizePublicProfile(user: AuthUser): PublicProfile {
  return {
    userId: user.userId,
    fullName: user.fullName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    country: user.country,
    city: user.city,
    gamingPlatform: user.gamingPlatform,
    experienceLevel: user.experienceLevel,
    preferredLanguage: user.preferredLanguage,
    availability: user.availability,
    gamingStyle: user.gamingStyle,
    bio: user.bio,
    favoriteGames: user.favoriteGames,
    achievements: user.achievements,
    wins: user.wins,
    matchesPlayed: user.matchesPlayed,
    points: user.points,
    idVerifiedStatus: user.idVerifiedStatus,
    idVerificationType: user.idVerificationType,
    isUnder18: user.isUnder18,
    parentalConsentStatus: user.parentalConsentStatus,
    role: user.role,
  };
}

export function getRoundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return 'Grand Final';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round ${roundNumber}`;
}

/**
 * Generates a single-elimination tournament bracket tree with unique readable Match IDs
 * and automatic BYE advancement when participant counts are not powers of 2.
 */
export function generateSingleEliminationBracket(
  tournamentId: string,
  participants: { userId: string; label: string }[],
  serverRegion: string,
  startIso: string
): TournamentMatch[] {
  if (participants.length < 2) return [];

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const totalRounds = Math.log2(bracketSize);
  const code = tournamentId.replace(/^trn_/, '').slice(0, 4).toUpperCase();
  const baseTime = Number.isNaN(new Date(startIso).getTime()) ? Date.now() : new Date(startIso).getTime();

  const matches: TournamentMatch[] = [];
  const slots: ({ userId: string; label: string } | null)[] = Array.from(
    { length: bracketSize },
    (_, i) => participants[i] ?? null
  );

  // Create Round 1 matches
  const r1Count = bracketSize / 2;
  for (let i = 0; i < r1Count; i++) {
    const pA = slots[i * 2];
    const pB = slots[i * 2 + 1];
    const matchTime = new Date(baseTime + i * 30 * 60 * 1000).toISOString();

    let winnerId: string | null = null;
    let winnerName: string | null = null;
    let status: TournamentMatch['status'] = 'checkin_open';
    let scoreA: number | null = null;
    let scoreB: number | null = null;

    if (pA && !pB) {
      winnerId = pA.userId;
      winnerName = pA.label;
      status = 'completed';
      scoreA = 1;
      scoreB = 0;
    } else if (!pA && pB) {
      winnerId = pB.userId;
      winnerName = pB.label;
      status = 'completed';
      scoreA = 0;
      scoreB = 1;
    } else if (!pA && !pB) {
      status = 'completed';
    }

    matches.push({
      id: `M-${code}-R1M${i + 1}`,
      tournamentId,
      roundNumber: 1,
      roundName: getRoundLabel(1, totalRounds),
      matchIndex: i,
      participantAId: pA?.userId || null,
      participantAName: pA?.label || 'BYE',
      participantBId: pB?.userId || null,
      participantBName: pB?.label || 'BYE',
      scoreA,
      scoreB,
      winnerId,
      winnerName,
      status,
      serverRegion,
      scheduledAt: matchTime,
      reportedBy: null,
      verifiedBy: null,
    });
  }

  // Create subsequent rounds and propagate Round 1 BYEs
  for (let round = 2; round <= totalRounds; round++) {
    const count = bracketSize / Math.pow(2, round);
    for (let i = 0; i < count; i++) {
      const prevA = matches.find((m) => m.roundNumber === round - 1 && m.matchIndex === i * 2);
      const prevB = matches.find((m) => m.roundNumber === round - 1 && m.matchIndex === i * 2 + 1);
      const matchTime = new Date(baseTime + (round - 1) * 3 * 3600 * 1000 + i * 30 * 60 * 1000).toISOString();

      matches.push({
        id: `M-${code}-R${round}M${i + 1}`,
        tournamentId,
        roundNumber: round,
        roundName: getRoundLabel(round, totalRounds),
        matchIndex: i,
        participantAId: prevA?.winnerId || null,
        participantAName: prevA?.winnerName || 'TBD',
        participantBId: prevB?.winnerId || null,
        participantBName: prevB?.winnerName || 'TBD',
        scoreA: null,
        scoreB: null,
        winnerId: null,
        winnerName: null,
        status: 'scheduled',
        serverRegion,
        scheduledAt: matchTime,
        reportedBy: null,
        verifiedBy: null,
      });
    }
  }

  return matches;
}

export function calculateRankPointsDelta(params: { isWinner: boolean; isGrandFinal: boolean }): number {
  let pts = 10; // match participation
  if (params.isWinner) pts += 25;
  if (params.isWinner && params.isGrandFinal) pts += 100;
  return pts;
}

export function validateIdentityBindingInput(idType: string, rawCode: string): { valid: boolean; error?: string } {
  const cleaned = (rawCode || '').trim();
  if (!['Fayda FAN', 'Student ID', 'Phone OTP'].includes(idType)) {
    return { valid: false, error: 'Select a valid verification method (Fayda FAN, Student ID, or Phone OTP).' };
  }
  if (idType === 'Fayda FAN' && !/^[A-Za-z0-9-]{8,20}$/.test(cleaned)) {
    return { valid: false, error: 'Fayda FAN must be 8–20 alphanumeric characters.' };
  }
  if (cleaned.length < 5) {
    return { valid: false, error: 'Verification identifier must be at least 5 characters.' };
  }
  return { valid: true };
}

export function buildScoutingCsv(entries: RankingEntry[]): string {
  const headers = [
    'Rank',
    'Username',
    'Full Name',
    'City',
    'Country',
    'Platform',
    'Experience',
    'Games',
    'Points',
    'Wins',
    'Matches',
    'Win Rate %',
    'ID Verification',
  ];
  const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const rows = entries.map((e) =>
    [
      e.rank,
      `@${e.username}`,
      e.fullName,
      e.city,
      e.country,
      e.gamingPlatform,
      e.experienceLevel,
      e.favoriteGames.join(' | '),
      e.points,
      e.wins,
      e.matchesPlayed,
      e.winRate,
      e.idVerifiedStatus,
    ]
      .map(escape)
      .join(',')
  );
  return [headers.map(escape).join(','), ...rows].join('\n');
}
