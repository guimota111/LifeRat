import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import type { IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

function icon(name: IconName) {
  const TabIcon = ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color} />;
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.today'), tabBarIcon: icon('today') }} />
      <Tabs.Screen name="habits" options={{ title: t('tabs.habits'), tabBarIcon: icon('list') }} />
      <Tabs.Screen name="clubs" options={{ title: t('tabs.clubs'), tabBarIcon: icon('people') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
