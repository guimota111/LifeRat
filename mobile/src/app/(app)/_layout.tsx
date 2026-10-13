import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="habit/[id]" options={{ title: t('habit.title'), presentation: 'modal' }} />
      <Stack.Screen name="club/[id]" options={{ title: '' }} />
      <Stack.Screen name="challenge/new" options={{ title: t('challenge.new'), presentation: 'modal' }} />
      <Stack.Screen name="challenge/[id]" options={{ title: t('challenge.title') }} />
    </Stack>
  );
}
