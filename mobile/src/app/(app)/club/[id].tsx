import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Button, Card, ErrorText, Loading, Screen, Section } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useClub, useClubChallenges, useClubMembers, useLeaveClub } from '@/hooks/use-clubs';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/dates';
import { useUserId } from '@/providers/auth';

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const uid = useUserId();
  const club = useClub(id);
  const members = useClubMembers(id);
  const challenges = useClubChallenges(id);
  const leave = useLeaveClub();

  const me = members.data?.find((m) => m.user_id === uid);
  const isAdmin = me?.role === 'owner' || me?.role === 'admin';

  const share = () => {
    if (!club.data) return;
    void Share.share({ message: t('clubs.shareMessage', { name: club.data.name, code: club.data.invite_code }) });
  };

  const confirmLeave = () => {
    Alert.alert(t('clubs.leave'), t('clubs.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('clubs.leave'), style: 'destructive', onPress: () => leave.mutate({ clubId: id }, { onSuccess: () => router.back() }) },
    ]);
  };

  const refreshing = club.isRefetching || members.isRefetching || challenges.isRefetching;
  const refresh = () => {
    void club.refetch();
    void members.refetch();
    void challenges.refetch();
  };

  if (club.isLoading) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: club.data?.name ?? '' }} />
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ErrorText error={club.error ?? members.error ?? challenges.error ?? leave.error} />
        {club.data?.description ? <ThemedText themeColor="textSecondary">{club.data.description}</ThemedText> : null}

        <Card style={styles.inviteCard}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('clubs.inviteCode')}
            </ThemedText>
            <ThemedText type="subtitle" style={{ letterSpacing: 2 }}>
              {club.data?.invite_code}
            </ThemedText>
          </View>
          <Button title={t('common.share')} icon="share-outline" variant="secondary" onPress={share} />
        </Card>

        <Section
          title={t('clubs.challenges')}
          right={isAdmin ? <Button title={t('clubs.newChallenge')} icon="add" variant="ghost" onPress={() => router.push(`/challenge/new?clubId=${id}`)} /> : undefined}>
          {(challenges.data ?? []).length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('clubs.noChallenges')}
            </ThemedText>
          ) : (
            (challenges.data ?? []).map((c) => (
              <Card key={c.id} onPress={() => router.push(`/challenge/${c.id}`)} style={styles.row}>
                <Ionicons name="trophy" size={22} color={c.state === 'active' ? theme.accent : theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <ThemedText numberOfLines={1}>{c.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t(`challenge.metrics.${c.spec.metric}`)} · {t('challenge.period', { start: formatDate(c.starts_on, i18n.language), end: formatDate(c.ends_on, i18n.language) })}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </Card>
            ))
          )}
        </Section>

        <Section title={`${t('clubs.members')} (${members.data?.length ?? 0})`}>
          {(members.data ?? []).map((m) => (
            <View key={m.user_id} style={styles.row}>
              <Avatar name={m.profile?.display_name ?? '?'} />
              <View style={{ flex: 1 }}>
                <ThemedText>
                  {m.profile?.display_name ?? '?'}
                  {m.user_id === uid ? ` (${t('common.you')})` : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {m.profile?.handle ? `@${m.profile.handle} · ` : ''}
                  {t(`clubs.roles.${m.role}`)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Section>

        {me && me.role !== 'owner' ? <Button title={t('clubs.leave')} variant="ghost" onPress={confirmLeave} /> : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
