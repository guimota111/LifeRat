import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, ChipGroup, ErrorText, Screen, Section, SwitchRow, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCreateChallenge } from '@/hooks/use-clubs';
import { addDays, isValidDate, today } from '@/lib/dates';
import type { ChallengeMetric, ProofKind } from '@/lib/types';
import { useTimeZone } from '@/providers/auth';

export default function NewChallengeScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const { t } = useTranslation();
  const tz = useTimeZone();
  const create = useCreateChallenge();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsOn, setStartsOn] = useState(today(tz));
  const [endsOn, setEndsOn] = useState(addDays(today(tz), 30));
  const [metric, setMetric] = useState<ChallengeMetric>('steps');
  const [unit, setUnit] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [proof, setProof] = useState<ProofKind>('none');
  const [bet, setBet] = useState('');

  const datesValid = isValidDate(startsOn) && isValidDate(endsOn) && endsOn >= startsOn;
  const valid = name.trim().length > 0 && datesValid && !!clubId;

  const submit = () => {
    create.mutate(
      {
        club_id: clubId,
        name: name.trim(),
        description: description.trim(),
        starts_on: startsOn,
        ends_on: endsOn,
        spec: { metric, aggregate: 'sum', win: 'highest', ...(metric === 'habit' && unit.trim() ? { unit: unit.trim() } : {}) },
        proof,
        verified_only: verifiedOnly,
        bet: bet.trim() || null,
      },
      { onSuccess: (c) => router.replace(`/challenge/${c.id}`) },
    );
  };

  return (
    <Screen>
      <TextField label={t('challenge.name')} placeholder={t('challenge.namePlaceholder')} value={name} onChangeText={setName} />
      <TextField label={t('challenge.description')} value={description} onChangeText={setDescription} multiline />

      <View style={styles.inline}>
        <View style={{ flex: 1 }}>
          <TextField label={t('challenge.starts')} hint={t('challenge.dateHint')} value={startsOn} onChangeText={setStartsOn} autoCorrect={false} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label={t('challenge.ends')} hint={t('challenge.dateHint')} value={endsOn} onChangeText={setEndsOn} autoCorrect={false} />
        </View>
      </View>
      {!datesValid ? <ErrorText error={t('challenge.invalidDates')} /> : null}

      <Section title={t('challenge.metric')}>
        <ChipGroup
          options={(['steps', 'distance_km', 'habit'] as ChallengeMetric[]).map((m) => ({ value: m, label: t(`challenge.metrics.${m}`) }))}
          value={metric}
          onChange={setMetric}
        />
        {metric === 'habit' ? (
          <TextField label={t('challenge.unit')} hint={t('challenge.unitHint')} placeholder={t('habit.unitPlaceholder')} value={unit} onChangeText={setUnit} />
        ) : null}
      </Section>

      <SwitchRow label={t('challenge.verifiedOnly')} hint={t('challenge.verifiedOnlyHint')} value={verifiedOnly} onValueChange={setVerifiedOnly} />

      <Section title={t('challenge.proof')}>
        <ChipGroup
          options={(['none', 'photo_optional', 'photo_required'] as ProofKind[]).map((p) => ({ value: p, label: t(`challenge.proofs.${p}`) }))}
          value={proof}
          onChange={setProof}
        />
      </Section>

      <TextField label={t('challenge.bet')} hint={t('challenge.betHint')} placeholder={t('challenge.betPlaceholder')} value={bet} onChangeText={setBet} />

      <ErrorText error={create.error} />
      <Button title={t('common.create')} onPress={submit} loading={create.isPending} disabled={!valid} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: Spacing.two },
});
