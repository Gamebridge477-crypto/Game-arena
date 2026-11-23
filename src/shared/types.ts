export type UserRole = 'gamer' | 'organizer' | 'admin';

export type IdVerificationStatus = 'unverified' | 'pending' | 'verified';
export type ParentalConsentStatus = 'not_required' | 'pending' | 'approved';

export interface PublicProfile {
  userId: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  country: string;
  city: string;
  gamingPlatform: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Competitive' | 'Pro';
  preferredLanguage: string;
  availability: string;
  gamingStyle: string;
  bio: string;
  favoriteGames: string[];
  achievements: string[];
  wins: number;
  matchesPlayed: number;
  points: number;
  idVerifiedStatus: IdVerificationStatus;
  idVerificationType: string;
  isUnder18: boolean;
  parentalConsentStatus: ParentalConsentStatus;
  role: UserRole;
}

export interface AuthUser extends PublicProfile {
  email: string;
  status: 'active' | 'suspended';
  blockedUserIds: string[];
  telegramHandle: string;
  notifyTelegram: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  guardianName: string;
  createdAt: string;
}

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  genre: string;
  platforms: string[];
  regionServers: string;
  activePlayersCount: number;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  gameTitle: string;
  captainId: string;
  captainUsername: string;
  region: string;
  recruiting: boolean;
  memberCount: number;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  senderId: string;
  senderUsername: string;
  senderFullName: string;
  receiverId: string;
  receiverUsername: string;
  receiverFullName: string;
  teamId: string | null;
  teamName: string | null;
  gameTitle: string;
  roleNeeded: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export type TournamentStatus = 'pending_approval' | 'open' | 'ongoing' | 'completed' | 'rejected';
export type PrizeEscrowStatus = 'pledged' | 'verified_escrow' | 'disbursed';

export interface Tournament {
  id: string;
  title: string;
  gameTitle: string;
  organizerId: string;
  organizerName: string;
  region: string;
  format: string;
  prizePool: string;
  prizeEscrowStatus: PrizeEscrowStatus;
  prizePayoutRail: string;
  checkInOpen: boolean;
  maxParticipants: number;
  registeredCount: number;
  checkedInCount?: number;
  registrationDeadline: string;
  startDate: string;
  scheduleSummary: string;
  rulesSummary: string;
  resultsSummary: string;
  status: TournamentStatus;
  isRegistered?: boolean;
  isCheckedIn?: boolean;
  createdAt: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  username: string;
  teamName: string;
  inGameId: string;
  status: 'confirmed' | 'waitlist';
  checkedIn: boolean;
  checkedInAt: string | null;
  idVerifiedStatus?: IdVerificationStatus;
  createdAt: string;
}

export type MatchStatus = 'scheduled' | 'checkin_open' | 'live' | 'disputed' | 'completed';

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  roundName: string;
  matchIndex: number;
  participantAId: string | null;
  participantAName: string;
  participantBId: string | null;
  participantBName: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  winnerName: string | null;
  status: MatchStatus;
  serverRegion: string;
  scheduledAt: string;
  reportedBy: string | null;
  verifiedBy: string | null;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  country: string;
  city: string;
  gamingPlatform: string;
  experienceLevel: string;
  favoriteGames: string[];
  wins: number;
  matchesPlayed: number;
  winRate: number;
  points: number;
  idVerifiedStatus: IdVerificationStatus;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  gameFocus: string;
  region: string;
  city: string;
  clubType: string;
  description: string;
  rules: string;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  isMember?: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  postType: 'announcement' | 'activity' | 'discussion';
  title: string;
  content: string;
  eventDate: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  linkView: string;
  isRead: boolean;
  createdAt: string;
}

export type AppealStatus = 'none' | 'pending' | 'upheld' | 'overturned';

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: 'user' | 'community' | 'post' | 'tournament' | 'match';
  targetId: string;
  targetLabel: string;
  matchId: string | null;
  reason: string;
  details: string;
  status: 'open' | 'awaiting_response' | 'reviewed' | 'dismissed' | 'action_taken';
  clarificationPrompt: string;
  responseNote: string;
  decisionNote: string;
  appealReason: string;
  appealStatus: AppealStatus;
  createdAt: string;
}

export interface OrganizationItem {
  id: string;
  ownerId: string;
  ownerUsername: string;
  name: string;
  orgType: 'sponsor' | 'club' | 'organizer' | 'academy';
  country: string;
  city: string;
  website: string;
  description: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface OpportunityItem {
  id: string;
  orgId: string;
  orgName: string;
  orgVerified: boolean;
  title: string;
  category: 'sponsorship' | 'club' | 'event' | 'career' | 'equipment';
  region: string;
  deadline: string;
  description: string;
  requirements: string;
  status: 'open' | 'closed';
  hasApplied?: boolean;
  createdAt: string;
}

export interface ConnectionTestResult {
  id?: string;
  regionNode: string;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  stability: 'Excellent' | 'Stable' | 'Playable' | 'Unstable';
  createdAt: string;
}

export interface MatchmakingFilters {
  game?: string;
  platform?: string;
  experienceLevel?: string;
  language?: string;
  region?: string;
  availability?: string;
  gamingStyle?: string;
  search?: string;
}

export interface AnalyticsSummary {
  totalEvents: number;
  pageViews: number;
  speedTestsRun: number;
  tournamentRegistrations: number;
  matchInvitesSent: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalTournaments: number;
  totalCommunities: number;
  totalOpportunities: number;
  openReports: number;
  pendingTournaments: number;
  pendingOrgs: number;
  totalRegistrations: number;
  verifiedPlayers: number;
}
