import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/config';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 18, gap: 12, paddingBottom: 50 },
  title: { fontSize: 23, fontWeight: '800', color: COLORS.ink },
  subtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  value: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: COLORS.ink, minHeight: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  error: { color: COLORS.red, fontSize: 13 },
  button: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondary: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  secondaryText: { color: COLORS.ink, fontWeight: '700' },
});
export function Page({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
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
  return <Pressable onPress={onPress} disabled={disabled}
    style={[styles.button, secondary && styles.secondary, disabled && { opacity: .5 }]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{children}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, multiline = false,
  keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText: (value: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: 'default'|'email-address'|'phone-pad';
  autoCapitalize?: 'none'|'sentences'|'words';
}) {
  return <View style={{ gap: 5 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, multiline && { minHeight: 88, textAlignVertical: 'top' }]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={COLORS.muted} multiline={multiline} keyboardType={keyboardType}
      autoCapitalize={autoCapitalize} autoCorrect={false}/>
  </View>;
}
export function ChoiceRow<T extends string>({ options, selected, onChange }: {
  options: readonly (readonly [T, string])[]; selected: T; onChange: (value: T) => void;
}) {
  return <View style={styles.row}>{options.map(([value, label]) =>
    <Pressable key={value} onPress={() => onChange(value)}
      style={{ padding: 10, borderRadius: 9, borderWidth: 1,
        borderColor: selected === value ? COLORS.primary : COLORS.border,
        backgroundColor: selected === value ? '#E6F5EF' : COLORS.white }}>
      <Text style={{ fontWeight: selected === value ? '700' : '500', color: COLORS.ink }}>{label}</Text>
    </Pressable>)}</View>;
}
export function Busy({ label = 'Loading from server…' }: { label?: string }) {
  return <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
    <ActivityIndicator color={COLORS.primary}/><Text style={styles.subtitle}>{label}</Text>
  </View>;
}
