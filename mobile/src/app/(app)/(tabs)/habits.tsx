import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ErrorText, IconButton, Loading, Screen, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useHabits } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';

export default function HabitsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const habits = useHabits();
  const [showArchived, setShowArchived] = useState(false);

  const list = (habits.data ?? []).filter((h) => showArchived || !h.archived_at);
  const hasArchived = (habits.data ?? []).some((h) => h.archived_at);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="add" onPress={() => router.push('/habit/new')} style={{ marginRight: Spacing.two }} />
          ),
        }}
      />
      <Screen>
        <ErrorText error={habits.error} />
        {habits.isLoading ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState icon="list-outline" title={t('habits.empty')} hint={t('habits.emptyHint')} />
        ) : (
          list.map((h) => (
            <Card key={h.id} onPress={() => router.push(`/habit/${h.id}`)} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: h.archived_at ? theme.backgroundSelected : h.color }]}>
                <Ionicons name={h.icon as IconName} size={20} color={h.archived_at ? theme.textSecondary : '#fff'} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText numberOfLines={1} themeColor={h.archived_at ? 'textSecondary' : 'text'}>
                  {h.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {h.archived_at ? t('habits.archived') : t(`habit.frequencies.${h.frequency_kind}`)}
                  {h.negative ? ` · ${t('habit.negative')}` : ''}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          ))
        )}
        {hasArchived ? (
          <Button
            title={showArchived ? t('habits.hideArchived') : t('habits.showArchived')}
            variant="ghost"
            onPress={() => setShowArchived((v) => !v)}
          />
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
