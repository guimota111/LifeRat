import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, ErrorText, Screen, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deviceTimeZone } from '@/lib/dates';
import { deviceLocale } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim(), locale: deviceLocale(), timezone: deviceTimeZone() },
      },
    });
    if (err) {
      setError(err);
    } else if (!data.session) {
      // Confirmação de e-mail ligada no projeto: a sessão só vem depois de confirmar.
      setInfo(t('auth.checkEmail'));
    }
    setBusy(false);
  };

  return (
    <Screen safeTop style={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ gap: Spacing.one, marginBottom: Spacing.four }}>
        <ThemedText type="subtitle">{t('auth.signUp')}</ThemedText>
      </View>
      <TextField label={t('auth.displayName')} value={displayName} onChangeText={setDisplayName} autoComplete="name" />
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
      <ErrorText error={error} />
      {info ? <ThemedText themeColor="textSecondary">{info}</ThemedText> : null}
      <Button
        title={t('auth.signUp')}
        onPress={submit}
        loading={busy}
        disabled={!displayName.trim() || !email || password.length < 6}
      />
      <Button title={t('auth.haveAccount')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
