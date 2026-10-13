import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { HabitRow } from '@/components/habit-row';
import { ThemedText } from '@/components/themed-text';
import { Button, EmptyState, ErrorText, Loading, Screen, TextField } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useAddEntry, useEntriesSince, useHabits, useRemoveLastEntry } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { startOfMonth, today } from '@/lib/dates';
import { isDueOn, statusOf } from '@/lib/habits';
import type { Habit } from '@/lib/types';
import { useAuth, useTimeZone } from '@/providers/auth';

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { profile } = useAuth();
  const tz = useTimeZone();
  const date = today(tz);
  const habits = useHabits();
  const entries = useEntriesSince(startOfMonth(date));
  const add = useAddEntry();
  const undo = useRemoveLastEntry();
  const [custom, setCustom] = useState<Habit | null>(null);
  const [amount, setAmount] = useState('');

  const due = useMemo(() => (habits.data ?? []).filter((h) => isDueOn(h, date)), [habits.data, date]);
  const statuses = useMemo(
    () => new Map(due.map((h) => [h.id, statusOf(h, entries.data ?? [], date)])),
    [due, entries.data, date],
  );
  const doneCount = [...statuses.values()].filter((s) => s.done).length;

  const refreshing = habits.isRefetching || entries.isRefetching;
  const refresh = () => {
    void habits.refetch();
    void entries.refetch();
  };

  const heading = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  if (habits.isLoading || entries.isLoading) return <Loading />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
          {heading}
        </ThemedText>
        <ThemedText type="subtitle">{profile?.display_name ?? ''}</ThemedText>
        {due.length ? (
          <ThemedText themeColor="textSecondary">{t('today.summary', { done: doneCount, total: due.length })}</ThemedText>
        ) : null}
      </View>

      <ErrorText error={habits.error ?? entries.error ?? add.error ?? undo.error} />

      {due.length === 0 ? (
        <EmptyState icon="sunny-outline" title={t('today.empty')} hint={t('today.emptyHint')} />
      ) : (
        due.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            status={statuses.get(h.id)!}
            onAdd={(value) => add.mutate({ habitId: h.id, value })}
            onUndo={() => undo.mutate({ habitId: h.id })}
            onCustom={() => {
              setAmount('');
              setCustom(h);
            }}
            onPress={() => router.push(`/habit/${h.id}`)}
          />
        ))
      )}

      <Modal visible={!!custom} transparent animationType="fade" onRequestClose={() => setCustom(null)}>
        <Pressable style={styles.backdrop} onPress={() => setCustom(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={() => {}}>
            <ThemedText type="smallBold">{custom?.name}</ThemedText>
            <TextField
              label={custom?.unit ? `${t('common.amount')} (${custom.unit})` : t('common.amount')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Button
              title={t('common.add')}
              disabled={!(Number(amount.replace(',', '.')) > 0)}
              onPress={() => {
                if (custom) add.mutate({ habitId: custom.id, value: Number(amount.replace(',', '.')) });
                setCustom(null);
              }}
            />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setCustom(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  sheet: { borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.three },
});
