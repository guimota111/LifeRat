import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ───────────────────────────── layout ─────────────────────────────

export function Screen({
  children,
  scroll = true,
  safeTop = false,
  style,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
  refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const theme = useTheme();
  const edges: Edge[] = safeTop ? ['top', 'left', 'right'] : ['left', 'right'];
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Section({ title, children, right }: { title: string; children?: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          {title}
        </ThemedText>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.backgroundElement }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={theme.textSecondary} />
      <ThemedText style={{ textAlign: 'center' }}>{title}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  const theme = useTheme();
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <ThemedText type="small" style={{ color: theme.danger }}>
      {message}
    </ThemedText>
  );
}

// ───────────────────────────── controls ─────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}: PressableProps & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const bg = {
    primary: theme.accent,
    secondary: theme.backgroundSelected,
    danger: theme.danger,
    ghost: 'transparent',
  }[variant];
  const fg = {
    primary: theme.onAccent,
    secondary: theme.text,
    danger: '#ffffff',
    ghost: theme.accent,
  }[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <ThemedText type="smallBold" style={{ color: fg }}>
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  color,
  size = 22,
  style,
  ...rest
}: PressableProps & { icon: IconName; color?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <Pressable
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 }, style]}
      {...rest}>
      <Ionicons name={icon} size={size} color={color ?? theme.text} />
    </Pressable>
  );
}

export function TextField({
  label,
  hint,
  style,
  ...rest
}: TextInputProps & { label?: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
          style,
        ]}
        {...rest}
      />
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const accent = color ?? theme.accent;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : theme.backgroundElement,
          borderColor: selected ? accent : theme.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onAccent : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  disabledValues,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabledValues?: T[];
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={o.value === value}
          onPress={() => onChange(o.value)}
          disabled={disabledValues?.includes(o.value)}
        />
      ))}
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, gap: Spacing.one }}>
        <ThemedText>{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.accent }} />
    </View>
  );
}

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const theme = useTheme();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ThemedText type="smallBold" style={{ color: theme.onAccent, fontSize: size * 0.4 }}>
        {initials || '?'}
      </ThemedText>
    </View>
  );
}

// ───────────────────────────── styles ─────────────────────────────

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    minHeight: 46,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
