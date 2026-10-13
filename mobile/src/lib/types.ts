// Tipos espelhando supabase/migrations. Quando o projeto estiver linkado,
// `npm run gen:types` gera src/lib/database.types.ts a partir do banco.

export type Visibility = 'private' | 'friends' | 'public';
export type Plan = 'free' | 'pro';
export type HabitKind = 'bool' | 'counter' | 'duration' | 'quantity' | 'catalog' | 'integration';
export type GoalWindow = 'day' | 'week' | 'month';
export type FrequencyKind = 'daily' | 'times_per_week' | 'weekdays' | 'every_n_days';
export type EntrySource = 'manual' | 'healthkit' | 'health_connect' | 'strava' | 'shortcut';
export type ClubRole = 'owner' | 'admin' | 'member';
export type ChallengeState = 'draft' | 'active' | 'finished';
export type ProofKind = 'none' | 'photo_optional' | 'photo_required';
export type ChallengeMetric = 'steps' | 'distance_km' | 'habit';

export interface Profile {
  id: string;
  handle: string | null;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  visibility: Visibility;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export type PublicProfile = Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url'>;

export interface Habit {
  id: string;
  owner_id: string;
  name: string;
  icon: string;
  color: string;
  kind: HabitKind;
  unit: string | null;
  goal_value: number | null;
  goal_window: GoalWindow;
  frequency_kind: FrequencyKind;
  frequency_n: number | null;
  frequency_days: number[] | null;
  step_value: number;
  negative: boolean;
  visibility: Visibility;
  integration_metric: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HabitInput = Omit<Habit, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'archived_at'> & {
  id?: string;
};

export interface HabitEntry {
  id: string;
  habit_id: string;
  user_id: string;
  occurred_at: string;
  local_date: string;
  value: number;
  source: EntrySource;
  external_id: string | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface Club {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  cover_path: string | null;
  is_public: boolean;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: ClubRole;
  joined_at: string;
  profile: PublicProfile | null;
}

export interface ChallengeSpec {
  metric: ChallengeMetric;
  unit?: string;
  aggregate: 'sum';
  win: 'highest';
}

export interface Challenge {
  id: string;
  club_id: string;
  creator_id: string;
  name: string;
  description: string;
  starts_on: string;
  ends_on: string;
  spec: ChallengeSpec;
  proof: ProofKind;
  verified_only: boolean;
  teams: boolean;
  bet: string | null;
  state: ChallengeState;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  challenge_id: string;
  user_id: string;
  habit_id: string | null;
  team: string | null;
  handicap_mult: number;
  handicap_add: number;
  joined_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  team: string | null;
  raw_score: number;
  score: number;
  reached_at: string | null;
}
