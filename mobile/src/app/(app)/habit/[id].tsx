import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Chip, ChipGroup, ErrorText, Loading, Screen, Section, SwitchRow, TextField, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useDeleteHabit, useHabits, useSaveHabit, useSetHabitArchived } from '@/hooks/use-habits';
import { useTheme } from '@/hooks/use-theme';
import { HABIT_COLORS, HABIT_ICONS } from '@/lib/habits';
import type { FrequencyKind, GoalWindow, Habit, HabitInput, HabitKind, Visibility } from '@/lib/types';

const DEFAULT_UNIT: Record<HabitKind, string> = {
  bool: '',
  counter: '',
  duration: 'min',
  quantity: '',
  catalog: '',
  integration: '',
};

function blank(): HabitInput {
  return {
    name: '',
    icon: 'ellipse-outline',
    color: HABIT_COLORS[0],
    kind: 'bool',
    unit: null,
    goal_value: null,
    goal_window: 'day',
    frequency_kind: 'daily',
    frequency_n: null,
    frequency_days: null,
    step_value: 1,
    negative: false,
    visibility: 'friends',
    integration_metric: null,
    sort_order: 0,
  };
}

function fromHabit(h: Habit): HabitInput {
  const { owner_id: _o, created_at: _c, updated_at: _u, archived_at: _a, ...rest } = h;
  return rest;
}

function num(s: string): number | null {
  const n = Number(s.replace(',', '.'));
  return s.trim() === '' || Number.isNaN(n) ? null : n;
}

export default function HabitFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const habits = useHabits();
  const existing = habits.data?.find((h) => h.id === id);

  if (!isNew && habits.isLoading) return <Loading />;
  if (!isNew && !existing) return <Loading />;

  return <HabitForm key={id} initial={existing ? fromHabit(existing) : blank()} existing={existing ?? null} />;
}

function HabitForm({ initial, existing }: { initial: HabitInput; existing: Habit | null }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveHabit();
  const archive = useSetHabitArchived();
  const remove = useDeleteHabit();

  const [form, setForm] = useState<HabitInput>(initial);
  const [goalText, setGoalText] = useState(initial.goal_value == null ? '' : String(initial.goal_value));
  const [stepText, setStepText] = useState(String(initial.step_value));
  const [nText, setNText] = useState(initial.frequency_n == null ? '' : String(initial.frequency_n));

  const patch = (p: Partial<HabitInput>) => setForm((f) => ({ ...f, ...p }));
  const weekdaysShort = t('habit.weekdaysShort', { returnObjects: true }) as string[];

  const setKind = (kind: HabitKind) => {
    patch({
      kind,
      unit: DEFAULT_UNIT[kind] || null,
      integration_metric: kind === 'integration' ? 'steps' : null,
      negative: kind === 'bool' ? form.negative : false,
    });
    if (kind === 'integration') patch({ unit: 'steps' });
  };

  const hasAmount = form.kind !== 'bool' && form.kind !== 'integration';
  const nValid =
    form.frequency_kind === 'times_per_week'
      ? !!form.frequency_n && form.frequency_n >= 1 && form.frequency_n <= 7
      : form.frequency_kind === 'every_n_days'
        ? !!form.frequency_n && form.frequency_n >= 2
        : form.frequency_kind === 'weekdays'
          ? (form.frequency_days?.length ?? 0) > 0
          : true;
  const valid = form.name.trim().length > 0 && nValid && (!hasAmount || (form.goal_value ?? 0) > 0) && form.step_value > 0;

  const submit = () => {
    save.mutate(
      {
        ...form,
        name: form.name.trim(),
        unit: form.unit?.trim() || null,
        goal_value: hasAmount ? form.goal_value : null,
        frequency_n: form.frequency_kind === 'times_per_week' || form.frequency_kind === 'every_n_days' ? form.frequency_n : null,
        frequency_days: form.frequency_kind === 'weekdays' ? form.frequency_days : null,
      },
      { onSuccess: () => router.back() },
    );
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(t('common.delete'), t('habit.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate({ id: existing.id }, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <Screen>
      <TextField label={t('habit.name')} placeholder={t('habit.namePlaceholder')} value={form.name} onChangeText={(name) => patch({ name })} />

      <Section title={t('habit.kind')}>
        <ChipGroup
          options={(['bool', 'counter', 'duration', 'quantity', 'integration', 'catalog'] as HabitKind[]).map((k) => ({
            value: k,
            label: k === 'catalog' ? `${t(`habit.kinds.${k}`)} (${t('common.soon')})` : t(`habit.kinds.${k}`),
          }))}
          value={form.kind}
          onChange={setKind}
          disabledValues={['catalog']}
        />
        {form.kind === 'catalog' ? <ThemedText type="small" themeColor="textSecondary">{t('habit.catalogSoon')}</ThemedText> : null}
      </Section>

      {form.kind === 'integration' ? (
        <Section title={t('habit.integrationMetric')}>
          <ChipGroup
            options={(['steps', 'distance_km'] as const).map((m) => ({ value: m, label: t(`habit.metrics.${m}`) }))}
            value={(form.integration_metric as 'steps' | 'distance_km') ?? 'steps'}
            onChange={(m) => patch({ integration_metric: m, unit: m === 'steps' ? 'steps' : 'km' })}
          />
          <ThemedText type="small" themeColor="textSecondary">{t('today.syncSoon')}</ThemedText>
        </Section>
      ) : null}

      {hasAmount ? (
        <>
          <View style={styles.inline}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('habit.goal')}
                value={goalText}
                keyboardType="decimal-pad"
                onChangeText={(s) => {
                  setGoalText(s);
                  patch({ goal_value: num(s) });
                }}
              />
            </View>
            {form.kind !== 'duration' ? (
              <View style={{ flex: 1 }}>
                <TextField label={t('habit.unit')} placeholder={t('habit.unitPlaceholder')} value={form.unit ?? ''} onChangeText={(unit) => patch({ unit })} />
              </View>
            ) : null}
          </View>
          <Section title={t('habit.goalWindow')}>
            <ChipGroup
              options={(['day', 'week', 'month'] as GoalWindow[]).map((w) => ({ value: w, label: t(`habit.windows.${w}`) }))}
              value={form.goal_window}
              onChange={(goal_window) => patch({ goal_window })}
            />
          </Section>
          <TextField
            label={t('habit.step')}
            value={stepText}
            keyboardType="decimal-pad"
            onChangeText={(s) => {
              setStepText(s);
              patch({ step_value: num(s) ?? 0 });
            }}
          />
        </>
      ) : null}

      <Section title={t('habit.frequency')}>
        <ChipGroup
          options={(['daily', 'times_per_week', 'weekdays', 'every_n_days'] as FrequencyKind[]).map((f) => ({ value: f, label: t(`habit.frequencies.${f}`) }))}
          value={form.frequency_kind}
          onChange={(frequency_kind) => patch({ frequency_kind })}
        />
        {form.frequency_kind === 'times_per_week' || form.frequency_kind === 'every_n_days' ? (
          <TextField
            label={form.frequency_kind === 'times_per_week' ? t('habit.timesPerWeek') : t('habit.everyNDays')}
            value={nText}
            keyboardType="number-pad"
            onChangeText={(s) => {
              setNText(s);
              patch({ frequency_n: num(s) });
            }}
          />
        ) : null}
        {form.frequency_kind === 'weekdays' ? (
          <View style={styles.chips}>
            {weekdaysShort.map((label, day) => {
              const selected = form.frequency_days?.includes(day) ?? false;
              return (
                <Chip
                  key={day}
                  label={label}
                  selected={selected}
                  onPress={() => {
                    const set = new Set(form.frequency_days ?? []);
                    if (selected) set.delete(day);
                    else set.add(day);
                    patch({ frequency_days: [...set].sort() });
                  }}
                />
              );
            })}
          </View>
        ) : null}
      </Section>

      {form.kind === 'bool' ? (
        <SwitchRow label={t('habit.negative')} hint={t('habit.negativeHint')} value={form.negative} onValueChange={(negative) => patch({ negative })} />
      ) : null}

      <Section title={t('habit.visibility')}>
        <ChipGroup
          options={(['private', 'friends', 'public'] as Visibility[]).map((v) => ({ value: v, label: t(`habit.visibilities.${v}`) }))}
          value={form.visibility}
          onChange={(visibility) => patch({ visibility })}
        />
      </Section>

      <Section title={t('habit.icon')}>
        <View style={styles.chips}>
          {HABIT_ICONS.map((icon) => (
            <Pressable
              key={icon}
              onPress={() => patch({ icon })}
              style={[styles.iconChip, { backgroundColor: form.icon === icon ? form.color : theme.backgroundElement }]}>
              <Ionicons name={icon as IconName} size={20} color={form.icon === icon ? '#fff' : theme.text} />
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title={t('habit.color')}>
        <View style={styles.chips}>
          {HABIT_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => patch({ color })}
              style={[styles.colorChip, { backgroundColor: color, borderColor: form.color === color ? theme.text : 'transparent' }]}
            />
          ))}
        </View>
      </Section>

      <ErrorText error={save.error ?? archive.error ?? remove.error} />
      <Button title={t('common.save')} onPress={submit} loading={save.isPending} disabled={!valid} />

      {existing ? (
        <View style={{ gap: Spacing.two }}>
          <Button
            title={existing.archived_at ? t('common.unarchive') : t('common.archive')}
            variant="secondary"
            loading={archive.isPending}
            onPress={() => archive.mutate({ id: existing.id, archived: !existing.archived_at }, { onSuccess: () => router.back() })}
          />
          <Button title={t('common.delete')} variant="ghost" onPress={confirmDelete} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  iconChip: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorChip: { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
});
