import { useMemo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LoadingState } from './LoadingState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/config';

export function useUIStyles() {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { padding: 18, gap: 12, paddingBottom: 50 },
    title: { fontSize: 23, fontWeight: '800', color: theme.ink },
    subtitle: { fontSize: 14, color: theme.muted, lineHeight: 20 },
    card: { backgroundColor: theme.white, padding: 16, borderRadius: 16,
      borderWidth: 1, borderColor: theme.border, gap: 8 },
    label: { fontSize: 12, fontWeight: '700', color: theme.muted },
    value: { fontSize: 15, fontWeight: '600', color: theme.ink },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 10,
      backgroundColor: theme.white, paddingHorizontal: 12, paddingVertical: 11,
      fontSize: 15, color: theme.ink, minHeight: 44 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    error: { color: theme.warning, fontSize: 13 },
    button: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 12,
      paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    buttonText: { color: theme.onPrimary, fontWeight: '800', fontSize: 14 },
    secondary: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border },
    secondaryText: { color: theme.primaryDark, fontWeight: '700' },
  }), [theme]);
}
export function Page({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const styles = useUIStyles();
  return <SafeAreaView edges={['left','right','bottom']} style={styles.screen}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled">{children}</ScrollView> :
        <View style={styles.screen}>{children}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Button({ children, onPress, disabled = false, secondary = false }: {
  children: ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  const styles = useUIStyles();
  const theme = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    accessibilityState={{ disabled }}
    style={[styles.button, secondary && styles.secondary, disabled && {
      backgroundColor: theme.surfaceMuted, borderColor: theme.border,
      borderWidth: 1, opacity: 1,
    }]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText,
      disabled && { color: theme.muted }]}>{children}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, multiline = false,
  keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: 'default'|'email-address'|'phone-pad';
  autoCapitalize?: 'none'|'sentences'|'words';
}) {
  const styles = useUIStyles();
  const theme = useTheme();
  return <View style={{ gap: 5 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, multiline && { minHeight: 88, textAlignVertical: 'top' }]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={theme.muted} multiline={multiline} keyboardType={keyboardType}
      autoCapitalize={autoCapitalize} autoCorrect={false}/>
  </View>;
}
export function Busy({ label = 'Loading from server…' }: { label?: string }) {
  return <LoadingState label={label}/>;
}
