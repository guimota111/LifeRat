import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Button, ChipGroup, ErrorText, Loading, Screen, Section, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import i18n, { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Profile, Visibility } from '@/lib/types';
import { useAuth } from '@/providers/auth';

export default function ProfileScreen() {
  const { profile } = useAuth();
  if (!profile) return <Loading />;
  // A key reinicia o formulário quando o perfil salvo muda.
  return <ProfileForm key={profile.updated_at} profile={profile} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [handle, setHandle] = useState(profile.handle ?? '');
  const [locale, setLocale] = useState<Locale>(profile.locale as Locale);
  const [visibility, setVisibility] = useState<Visibility>(profile.visibility);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    displayName.trim() !== profile.display_name ||
    (handle.trim() || null) !== profile.handle ||
    locale !== profile.locale ||
    visibility !== profile.visibility;

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        handle: handle.trim().toLowerCase() || null,
        locale,
        visibility,
      })
      .eq('id', profile.id);
    if (err) {
      setError(err.code === '23505' ? new Error(t('profile.handleTaken')) : err);
    } else {
      await i18n.changeLanguage(locale);
      await refreshProfile();
      setSaved(true);
    }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.two }}>
        <Avatar name={profile?.display_name ?? '?'} size={72} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('profile.plan')}: {t(`profile.plans.${profile?.plan ?? 'free'}`)}
        </ThemedText>
      </View>

      <TextField label={t('profile.displayName')} value={displayName} onChangeText={setDisplayName} />
      <TextField
        label={t('profile.handle')}
        hint={t('profile.handleHint')}
        value={handle}
        onChangeText={setHandle}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Section title={t('profile.language')}>
        <ChipGroup
          options={SUPPORTED_LOCALES.map((l) => ({ value: l, label: l === 'pt-BR' ? 'Português' : 'English' }))}
          value={locale}
          onChange={setLocale}
        />
      </Section>

      <Section title={t('profile.visibility')}>
        <ChipGroup
          options={(['private', 'friends', 'public'] as Visibility[]).map((v) => ({ value: v, label: t(`habit.visibilities.${v}`) }))}
          value={visibility}
          onChange={setVisibility}
        />
      </Section>

      <Section title={t('profile.timezone')}>
        <ThemedText>{profile?.timezone}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('profile.timezoneHint')}
        </ThemedText>
      </Section>

      <ErrorText error={error} />
      {saved ? <ThemedText type="small" themeColor="textSecondary">{t('profile.saved')}</ThemedText> : null}
      <Button title={t('common.save')} onPress={save} loading={busy} disabled={!dirty || !displayName.trim()} />
      <Button title={t('auth.signOut')} variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}
