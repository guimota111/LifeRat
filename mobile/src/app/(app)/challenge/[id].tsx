import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Button, Card, ChipGroup, ErrorText, Loading, Screen, Section } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useChallenge, useJoinChallenge, useLeaderboard, useParticipants } from '@/hooks/use-clubs';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/dates';
import { formatAmount } from '@/lib/habits';
import { useUserId } from '@/providers/auth';

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const uid = useUserId();
  const challenge = useChallenge(id);
  const participants = useParticipants(id);
  const leaderboard = useLeaderboard(id);
  const habits = useHabits();
  const join = useJoinChallenge();
  const [habitId, setHabitId] = useState<string | null>(null);

  const c = challenge.data;
  const joined = participants.data?.some((p) => p.user_id === uid) ?? false;
  const unit = c?.spec.unit;
  const eligible = (habits.data ?? []).filter((h) => !h.archived_at && h.kind !== 'integration' && (!unit || (h.unit ?? '').toLowerCase() === unit.toLowerCase()));

  const refreshing = challenge.isRefetching || leaderboard.isRefetching;
  const refresh = () => {
    void challenge.refetch();
    void participants.refetch();
    void leaderboard.refetch();
  };

  if (challenge.isLoading || !c) return <Loading />;

  const scoreUnit = c.spec.metric === 'steps' ? null : c.spec.metric === 'distance_km' ? 'km' : (unit ?? null);

  return (
    <>
      <Stack.Screen options={{ title: c.name }} />
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="small" themeColor="textSecondary">
            {t(`challenge.states.${c.state}`)} · {t('challenge.period', { start: formatDate(c.starts_on, i18n.language), end: formatDate(c.ends_on, i18n.language) })}
          </ThemedText>
          <ThemedText>
            {t('challenge.metric')}: {t(`challenge.metrics.${c.spec.metric}`)}
            {unit ? ` (${unit})` : ''}
          </ThemedText>
          {c.description ? <ThemedText themeColor="textSecondary">{c.description}</ThemedText> : null}
          {c.bet ? (
            <ThemedText themeColor="textSecondary">
              {t('challenge.bet')}: {c.bet}
            </ThemedText>
          ) : null}
          {c.verified_only ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('challenge.verifiedOnly')}
            </ThemedText>
          ) : null}
        </View>

        <ErrorText error={challenge.error ?? participants.error ?? leaderboard.error ?? join.error} />

        {joined ? (
          <Card style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            <ThemedText>{t('challenge.joined')}</ThemedText>
          </Card>
        ) : c.state === 'active' ? (
          <Card>
            {c.spec.metric === 'habit' ? (
              <>
                <ThemedText type="smallBold">{t('challenge.pickHabit')}</ThemedText>
                {eligible.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('challenge.noHabits')}
                  </ThemedText>
                ) : (
                  <ChipGroup options={eligible.map((h) => ({ value: h.id, label: h.name }))} value={habitId ?? ''} onChange={setHabitId} />
                )}
              </>
            ) : null}
            <Button
              title={t('challenge.join')}
              loading={join.isPending}
              disabled={c.spec.metric === 'habit' && !habitId}
              onPress={() => join.mutate({ challengeId: id, habitId: c.spec.metric === 'habit' ? habitId : null })}
            />
          </Card>
        ) : null}

        <Section title={t('challenge.leaderboard')}>
          {(leaderboard.data ?? []).length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('challenge.noParticipants')}
            </ThemedText>
          ) : (
            (leaderboard.data ?? []).map((row, i) => (
              <Card key={row.user_id} style={[styles.row, row.user_id === uid && { borderWidth: 1, borderColor: theme.accent }]}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={{ width: 24 }}>
                  {i + 1}
                </ThemedText>
                <Avatar name={row.display_name} />
                <View style={{ flex: 1 }}>
                  <ThemedText numberOfLines={1}>
                    {row.display_name}
                    {row.user_id === uid ? ` (${t('common.you')})` : ''}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">{formatAmount(Number(row.score), scoreUnit)}</ThemedText>
              </Card>
            ))
          )}
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
