import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text,
  TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/config';
import { styles } from './ui';

export type SelectOption = { value: string; label: string; count?: number };

export function SelectSheet({
  title, value, options, onChange, searchable = false, disabled = false, placeholder,
}: {
  title: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const selected = options.find((option) => option.value === value);
  const visible = useMemo(() => options.filter((option) =>
    (option.label + ' ' + option.value).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [options, query]);

  const close = () => { setOpen(false); setQuery(''); };
  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + ', ' + (selected?.label || placeholder || 'Select')}
      disabled={disabled}
      onPress={() => setOpen(true)}
      style={[styles.input, {
        justifyContent: 'center', paddingVertical: 9, opacity: disabled ? .55 : 1,
      }]}>
      <Text style={[styles.label, { marginBottom: 2 }]}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text numberOfLines={1} style={{ color: COLORS.ink, fontWeight: '700', flex: 1 }}>
          {selected?.label || placeholder || 'Select'}
          {selected?.count !== undefined ? ' (' + selected.count + ')' : ''}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14 }}>⌄</Text>
      </View>
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close selection"
          onPress={close}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7,17,29,.52)' }}
        />
        <View style={{
          backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: height * .78, paddingHorizontal: 18, paddingTop: 10,
          paddingBottom: Math.max(20, insets.bottom + 12),
        }}>
          <View style={{ width: 38, height: 4, borderRadius: 8, backgroundColor: COLORS.border,
            alignSelf: 'center', marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[styles.title, { fontSize: 19 }]}>{title}</Text>
            <Pressable onPress={close} accessibilityLabel="Close sheet" hitSlop={12}>
              <Text style={{ color: COLORS.muted, fontWeight: '700', fontSize: 16 }}>Done</Text>
            </Pressable>
          </View>
          {searchable ? <TextInput
            autoCorrect={false} autoCapitalize="none"
            value={query} onChangeText={setQuery}
            placeholder={'Search ' + title.toLowerCase()}
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { marginBottom: 8 }]}
          /> : null}
          <ScrollView
            nestedScrollEnabled keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}>
            {visible.map((option) => <Pressable key={option.value}
              accessibilityRole="button" accessibilityState={{ selected: value === option.value }}
              onPress={() => { onChange(option.value); close(); }}
              style={{
                paddingVertical: 15, minHeight: 51,
                borderBottomColor: COLORS.border, borderBottomWidth: .6,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
              <Text numberOfLines={2} style={{
                color: value === option.value ? COLORS.primaryDark : COLORS.ink,
                fontWeight: value === option.value ? '800' : '500',
                flex: 1, fontSize: 15,
              }}>
                {option.label}
                {option.count !== undefined ? ' (' + option.count + ')' : ''}
              </Text>
              {value === option.value ? <Text style={{ color: COLORS.primary, fontWeight: '900' }}>✓</Text> : null}
            </Pressable>)}
            {visible.length === 0 ? <Text style={styles.subtitle}>No matching options.</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
