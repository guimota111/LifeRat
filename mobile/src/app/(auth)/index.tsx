import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, ErrorText, Screen, TextField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <Screen safeTop style={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ gap: Spacing.one, marginBottom: Spacing.four }}>
        <ThemedText type="title">LifeRats</ThemedText>
        <ThemedText themeColor="textSecondary">{t('auth.tagline')}</ThemedText>
      </View>
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
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
      />
      <ErrorText error={error} />
      <Button title={t('auth.signIn')} onPress={submit} loading={busy} disabled={!email || !password} />
      <Link href="/sign-up" asChild>
        <Button title={t('auth.noAccount')} variant="ghost" />
      </Link>
    </Screen>
  );
}
