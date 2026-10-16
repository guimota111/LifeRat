import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import type {
  Challenge,
  ChallengeParticipant,
  ChallengeSpec,
  Club,
  ClubMember,
  LeaderboardRow,
  ProofKind,
} from '@/lib/types';
import { useUserId } from '@/providers/auth';

export function useMyClubs() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['clubs', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*, club_members!inner(user_id)')
        .eq('club_members.user_id', uid)
        .order('created_at');
      if (error) throw error;
      return data as Club[];
    },
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Club;
    },
  });
}

export function useClubMembers(clubId: string) {
  return useQuery({
    queryKey: ['club-members', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_members')
        .select('*, profile:profiles(id, handle, display_name, avatar_url)')
        .eq('club_id', clubId)
        .order('joined_at');
      if (error) throw error;
      return data as ClubMember[];
    },
  });
}

export function useClubChallenges(clubId: string) {
  return useQuery({
    queryKey: ['challenges', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('club_id', clubId)
        .order('starts_on', { ascending: false });
      if (error) throw error;
      // spec é jsonb no banco; o app conhece o formato (ChallengeSpec).
      return data as unknown as Challenge[];
    },
  });
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('challenges').select('*').eq('id', id).single();
      if (error) throw error;
      return data as unknown as Challenge;
    },
  });
}

export function useParticipants(challengeId: string) {
  return useQuery({
    queryKey: ['participants', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);
      if (error) throw error;
      return data as ChallengeParticipant[];
    },
  });
}

export function useLeaderboard(challengeId: string) {
  return useQuery({
    queryKey: ['leaderboard', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('challenge_leaderboard', { challenge: challengeId });
      if (error) throw error;
      return data as LeaderboardRow[];
    },
  });
}

export function useCreateClub() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (input: { name: string; description: string; is_public: boolean }) => {
      const { data, error } = await supabase
        .from('clubs')
        .insert({ ...input, owner_id: uid })
        .select('*')
        .single();
      if (error) throw error;
      return data as Club;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clubs', uid] }),
  });
}

export function useJoinClub() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const { data, error } = await supabase.rpc('join_club', { code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clubs', uid] }),
  });
}

export function useLeaveClub() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ clubId }: { clubId: string }) => {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clubs', uid] }),
  });
}

export interface ChallengeInput {
  club_id: string;
  name: string;
  description: string;
  starts_on: string;
  ends_on: string;
  spec: ChallengeSpec;
  proof: ProofKind;
  verified_only: boolean;
  bet: string | null;
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (input: ChallengeInput) => {
      const { data, error } = await supabase
        .from('challenges')
        .insert({ ...input, spec: input.spec as unknown as Json, creator_id: uid, state: 'active' })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as Challenge;
    },
    onSuccess: (c) => qc.invalidateQueries({ queryKey: ['challenges', c.club_id] }),
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ challengeId, habitId }: { challengeId: string; habitId: string | null }) => {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: uid, habit_id: habitId });
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: ['participants', vars.challengeId] });
      void qc.invalidateQueries({ queryKey: ['leaderboard', vars.challengeId] });
    },
  });
}
