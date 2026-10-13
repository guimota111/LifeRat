import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ErrorText, Loading, Screen, Section, SwitchRow, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useCreateClub, useJoinClub, useMyClubs } from '@/hooks/use-clubs';
import { useTheme } from '@/hooks/use-theme';

export default function ClubsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const clubs = useMyClubs();
  const create = useCreateClub();
  const join = useJoinClub();

  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [code, setCode] = useState('');

  const submitCreate = () => {
    create.mutate(
      { name: name.trim(), description: description.trim(), is_public: isPublic },
      {
        onSuccess: (club) => {
          setMode('none');
          setName('');
          setDescription('');
          router.push(`/club/${club.id}`);
        },
      },
    );
  };

  const submitJoin = () => {
    join.mutate(
      { code: code.trim() },
      {
        onSuccess: (clubId) => {
          setMode('none');
          setCode('');
          router.push(`/club/${clubId}`);
        },
      },
    );
  };

  return (
    <Screen>
      <View style={styles.actions}>
        <Button title={t('clubs.create')} icon="add" variant={mode === 'create' ? 'primary' : 'secondary'} style={{ flex: 1 }} onPress={() => setMode(mode === 'create' ? 'none' : 'create')} />
        <Button title={t('clubs.join')} icon="key" variant={mode === 'join' ? 'primary' : 'secondary'} style={{ flex: 1 }} onPress={() => setMode(mode === 'join' ? 'none' : 'join')} />
      </View>

      {mode === 'create' ? (
        <Card>
          <TextField label={t('clubs.name')} value={name} onChangeText={setName} />
          <TextField label={t('clubs.description')} value={description} onChangeText={setDescription} multiline />
          <SwitchRow label={t('clubs.public')} hint={t('clubs.publicHint')} value={isPublic} onValueChange={setIsPublic} />
          <ErrorText error={create.error} />
          <Button title={t('common.create')} onPress={submitCreate} loading={create.isPending} disabled={!name.trim()} />
        </Card>
      ) : null}

      {mode === 'join' ? (
        <Card>
          <TextField label={t('clubs.inviteCode')} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} />
          <ErrorText error={join.error ? t('clubs.invalidCode') : null} />
          <Button title={t('common.join')} onPress={submitJoin} loading={join.isPending} disabled={!code.trim()} />
        </Card>
      ) : null}

      <ErrorText error={clubs.error} />
      {clubs.isLoading ? (
        <Loading />
      ) : (clubs.data ?? []).length === 0 ? (
        <EmptyState icon="people-outline" title={t('clubs.empty')} hint={t('clubs.emptyHint')} />
      ) : (
        <Section title={t('clubs.title')}>
          {(clubs.data ?? []).map((c) => (
            <Card key={c.id} onPress={() => router.push(`/club/${c.id}`)} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.accent }]}>
                <Ionicons name={c.is_public ? 'globe' : 'people'} size={20} color={theme.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText numberOfLines={1}>{c.name}</ThemedText>
                {c.description ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {c.description}
                  </ThemedText>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          ))}
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
