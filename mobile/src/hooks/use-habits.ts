import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Habit, HabitEntry, HabitInput } from '@/lib/types';
import { useTimeZone, useUserId } from '@/providers/auth';

export function useHabits() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['habits', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('owner_id', uid)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data as Habit[];
    },
  });
}

export function useEntriesSince(from: string) {
  const uid = useUserId();
  return useQuery({
    queryKey: ['entries', uid, from],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', uid)
        .gte('local_date', from)
        .order('occurred_at');
      if (error) throw error;
      return data as HabitEntry[];
    },
  });
}

export function useAddEntry() {
  const qc = useQueryClient();
  const uid = useUserId();
  const tz = useTimeZone();
  return useMutation({
    mutationFn: async ({ habitId, value }: { habitId: string; value: number }) => {
      const { error } = await supabase.from('habit_entries').insert({
        habit_id: habitId,
        user_id: uid,
        local_date: today(tz),
        value,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries', uid] }),
  });
}

export function useRemoveLastEntry() {
  const qc = useQueryClient();
  const uid = useUserId();
  const tz = useTimeZone();
  return useMutation({
    mutationFn: async ({ habitId }: { habitId: string }) => {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('id')
        .eq('habit_id', habitId)
        .eq('local_date', today(tz))
        .order('occurred_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      const id = (data as { id: string }[] | null)?.[0]?.id;
      if (!id) return;
      const { error: delError } = await supabase.from('habit_entries').delete().eq('id', id);
      if (delError) throw delError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries', uid] }),
  });
}

export function useSaveHabit() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async (input: HabitInput) => {
      const { data, error } = await supabase
        .from('habits')
        .upsert({ ...input, owner_id: uid })
        .select('*')
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', uid] }),
  });
}

export function useSetHabitArchived() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', uid] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['habits', uid] });
      void qc.invalidateQueries({ queryKey: ['entries', uid] });
    },
  });
}
