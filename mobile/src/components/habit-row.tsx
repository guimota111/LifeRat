import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, IconButton, ProgressBar, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount, type HabitStatus } from '@/lib/habits';
import type { Habit } from '@/lib/types';

interface Props {
  habit: Habit;
  status: HabitStatus;
  onAdd: (value: number) => void;
  onUndo: () => void;
  onCustom: () => void;
  onPress?: () => void;
}

export function HabitRow({ habit, status, onAdd, onUndo, onCustom, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = habit.color;

  const tap = (fn: () => void) => () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  let subtitle: string;
  if (habit.negative) {
    subtitle = status.total > 0 ? t('today.slips', { count: status.total }) : t('today.clean');
  } else if (habit.kind === 'bool') {
    subtitle = status.done ? t('today.done') : t('today.pending');
  } else if (habit.kind === 'integration') {
    subtitle = t('today.syncSoon');
  } else {
    subtitle = t('today.ofGoal', {
      total: formatAmount(status.total, null),
      goal: formatAmount(status.goal, habit.unit),
    });
    if (habit.goal_window === 'week') subtitle += ` · ${t('today.thisWeek')}`;
    if (habit.goal_window === 'month') subtitle += ` · ${t('today.thisMonth')}`;
  }
  if (status.daysTarget) {
    subtitle += ` · ${t('today.daysThisWeek', { done: status.daysDone ?? 0, target: status.daysTarget })}`;
  }

  const barColor = habit.negative ? (status.done ? theme.success : theme.danger) : status.done ? theme.success : color;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.main}>
        <View style={[styles.icon, { backgroundColor: color }]}>
          <Ionicons name={habit.icon as IconName} size={20} color="#fff" />
        </View>
        <View style={styles.text}>
          <ThemedText numberOfLines={1}>{habit.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        </View>
        <View style={styles.actions}>
          {habit.negative ? (
            <>
              {status.todayTotal > 0 ? <IconButton icon="arrow-undo" onPress={tap(onUndo)} /> : null}
              <IconButton icon="close" color="#fff" style={{ backgroundColor: theme.danger }} onPress={tap(() => onAdd(1))} />
            </>
          ) : habit.kind === 'bool' ? (
            <Pressable
              hitSlop={8}
              onPress={tap(() => (status.done ? onUndo() : onAdd(1)))}
              style={[
                styles.check,
                { borderColor: status.done ? theme.success : theme.border, backgroundColor: status.done ? theme.success : 'transparent' },
              ]}>
              {status.done ? <Ionicons name="checkmark" size={22} color="#fff" /> : null}
            </Pressable>
          ) : habit.kind === 'integration' || habit.kind === 'catalog' ? null : (
            <>
              {status.todayTotal > 0 ? <IconButton icon="remove" onPress={tap(onUndo)} /> : null}
              <Pressable
                hitSlop={8}
                onPress={tap(() => onAdd(Number(habit.step_value)))}
                onLongPress={tap(onCustom)}
                style={({ pressed }) => [styles.plus, { backgroundColor: color, opacity: pressed ? 0.8 : 1 }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  +{formatAmount(Number(habit.step_value), habit.unit)}
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </View>
      {habit.kind !== 'bool' && habit.kind !== 'integration' && !habit.negative ? (
        <ProgressBar ratio={status.ratio} color={barColor} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  main: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  check: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  plus: { minHeight: 40, paddingHorizontal: Spacing.three, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
