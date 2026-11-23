import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScoutingCsv,
  calculateRankPointsDelta,
  canRegisterForTournament,
  canUserManageTournament,
  evaluateConnectionQuality,
  formatExplicitDate,
  generateSingleEliminationBracket,
  sanitizePublicProfile,
  scoreMatchmakingCandidate,
  validateIdentityBindingInput,
  validateRegistrationInput,
} from './logic';
import type { AuthUser, PublicProfile } from './types';

test('validateRegistrationInput rejects invalid fields and accepts valid Ethiopian gamer registration', () => {
  const bad = validateRegistrationInput({
    fullName: 'A',
    username: 'bad user!',
    email: 'not-an-email',
    password: '123',
    country: '',
    favoriteGames: [],
    gamingPlatform: '',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length >= 5);

  const good = validateRegistrationInput({
    fullName: 'Dawit Mekonnen',
    username: 'dawit_addis',
    email: 'dawit@gamebridge.et',
    password: 'Password123',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    favoriteGames: ['Valorant', 'EA FC 25'],
    gamingPlatform: 'PC',
  });
  assert.equal(good.valid, true);
  assert.equal(good.errors.length, 0);
});

test('scoreMatchmakingCandidate filters accurately and boosts compatible regional players', () => {
  const viewer: PublicProfile = {
    userId: 'u1',
    fullName: 'Dawit',
    username: 'dawit_addis',
    avatarUrl: '',
    country: 'Ethiopia',
    city: 'Addis Ababa',
    gamingPlatform: 'PC',
    experienceLevel: 'Competitive',
    preferredLanguage: 'Amharic / English',
    availability: 'Evenings',
    gamingStyle: 'Aggressive Entry',
    bio: '',
    favoriteGames: ['Valorant', 'CS2'],
    achievements: [],
    wins: 12,
    matchesPlayed: 20,
    points: 420,
    idVerifiedStatus: 'verified',
    idVerificationType: 'Fayda FAN',
    isUnder18: false,
    parentalConsentStatus: 'not_required',
    role: 'gamer',
  };

  const candidateMatch: PublicProfile = {
    ...viewer,
    userId: 'u2',
    username: 'abebe_val',
    favoriteGames: ['Valorant'],
  };

  const candidateMismatch: PublicProfile = {
    ...viewer,
    userId: 'u3',
    username: 'kenya_mobile',
    country: 'Kenya',
    gamingPlatform: 'Mobile',
    favoriteGames: ['PUBG Mobile'],
  };

  const res1 = scoreMatchmakingCandidate(viewer, candidateMatch, { game: 'Valorant', region: 'Ethiopia' });
  assert.equal(res1.matches, true);
  assert.ok(res1.score >= 85);

  const res2 = scoreMatchmakingCandidate(viewer, candidateMismatch, { game: 'Valorant' });
  assert.equal(res2.matches, false);
});

test('evaluateConnectionQuality classifies network tiers accurately', () => {
  const excellent = evaluateConnectionQuality({
    downloadMbps: 42,
    uploadMbps: 18,
    pingMs: 28,
    jitterMs: 5,
  });
  assert.equal(excellent.stability, 'Excellent');

  const unstable = evaluateConnectionQuality({
    downloadMbps: 2.1,
    uploadMbps: 0.4,
    pingMs: 185,
    jitterMs: 48,
  });
  assert.equal(unstable.stability, 'Unstable');
});

test('canRegisterForTournament enforces open status, capacity, and deadline', () => {
  const openTourney = {
    status: 'open' as const,
    registrationDeadline: '2026-12-20T23:59:59Z',
    maxParticipants: 16,
  };
  assert.equal(canRegisterForTournament(openTourney, 10, '2026-11-15T12:00:00Z').allowed, true);
  assert.equal(canRegisterForTournament(openTourney, 16, '2026-11-15T12:00:00Z').allowed, false);
  assert.equal(canRegisterForTournament(openTourney, 5, '2026-12-25T00:00:00Z').allowed, false);
  assert.equal(
    canRegisterForTournament({ ...openTourney, status: 'pending_approval' }, 0, '2026-11-15T12:00:00Z').allowed,
    false
  );
});

test('sanitizePublicProfile removes PII email and blockedUserIds and checks tournament ownership', () => {
  const fullUser: AuthUser = {
    userId: 'u1',
    email: 'private@example.et',
    status: 'active',
    blockedUserIds: ['u99'],
    telegramHandle: '@selam_et',
    notifyTelegram: true,
    notifyEmail: true,
    notifyPush: true,
    guardianName: '',
    createdAt: '2026-01-01T00:00:00Z',
    fullName: 'Selamawit Tadesse',
    username: 'selam_org',
    avatarUrl: '',
    country: 'Ethiopia',
    city: 'Hawassa',
    gamingPlatform: 'PC',
    experienceLevel: 'Pro',
    preferredLanguage: 'Amharic',
    availability: 'Weekends',
    gamingStyle: 'IGL / Strategist',
    bio: 'Organizer',
    favoriteGames: ['Valorant'],
    achievements: [],
    wins: 5,
    matchesPlayed: 8,
    points: 200,
    idVerifiedStatus: 'verified',
    idVerificationType: 'Fayda FAN',
    isUnder18: false,
    parentalConsentStatus: 'not_required',
    role: 'organizer',
  };

  const sanitized = sanitizePublicProfile(fullUser);
  assert.equal('email' in sanitized, false);
  assert.equal('blockedUserIds' in sanitized, false);
  assert.equal('telegramHandle' in sanitized, false);
  assert.equal(sanitized.username, 'selam_org');

  assert.equal(canUserManageTournament({ userId: 'u1', role: 'organizer' }, { organizerId: 'u1' }), true);
  assert.equal(canUserManageTournament({ userId: 'u2', role: 'gamer' }, { organizerId: 'u1' }), false);
  assert.equal(canUserManageTournament({ userId: 'admin1', role: 'admin' }, { organizerId: 'u1' }), true);
});

test('formatExplicitDate formats unambiguous dates without numeric DD/MM confusion', () => {
  const formatted = formatExplicitDate('2026-12-10T23:59:00Z');
  assert.match(formatted, /Dec 2026/);
  assert.equal(formatted.includes('/'), false);
});

test('generateSingleEliminationBracket builds deterministic match tree with BYE advancement and points', () => {
  const matches = generateSingleEliminationBracket(
    'trn_addis',
    [
      { userId: 'u1', label: '@dawit_addis' },
      { userId: 'u2', label: '@bereket_fc' },
      { userId: 'u3', label: '@hana_pubgm' },
    ],
    'Ethiopia LAN',
    '2026-12-14T15:00:00Z'
  );
  assert.equal(matches.length, 3); // 2 semifinals + 1 final
  assert.equal(matches[0].id, 'M-ADDI-R1M1');
  assert.equal(matches[1].status, 'completed'); // BYE match auto-completed
  assert.equal(matches[1].winnerId, 'u3');
  assert.equal(matches[2].roundName, 'Grand Final');
  assert.equal(matches[2].participantBName, '@hana_pubgm'); // auto-advanced from BYE

  assert.equal(calculateRankPointsDelta({ isWinner: true, isGrandFinal: false }), 35);
  assert.equal(calculateRankPointsDelta({ isWinner: true, isGrandFinal: true }), 135);
  assert.equal(calculateRankPointsDelta({ isWinner: false, isGrandFinal: false }), 10);
});

test('validateIdentityBindingInput and buildScoutingCsv validate IDs and export clean CSV', () => {
  assert.equal(validateIdentityBindingInput('Fayda FAN', '123').valid, false);
  assert.equal(validateIdentityBindingInput('Fayda FAN', 'FAN-84920144').valid, true);

  const csv = buildScoutingCsv([
    {
      rank: 1,
      userId: 'u1',
      username: 'dawit_addis',
      fullName: 'Dawit Mekonnen',
      country: 'Ethiopia',
      city: 'Addis Ababa',
      gamingPlatform: 'PC',
      experienceLevel: 'Competitive',
      favoriteGames: ['Valorant', 'EA FC 25'],
      wins: 28,
      matchesPlayed: 42,
      winRate: 67,
      points: 980,
      idVerifiedStatus: 'verified',
    },
  ]);
  assert.match(csv, /"@dawit_addis"/);
  assert.match(csv, /"980"/);
});
