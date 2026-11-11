import { useMemo, useState } from 'react';
import {
  FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/config';
import { useUIStyles } from './ui';
import {
  UNSPECIFIED_COUNTRY, UNRECOGNIZED_COUNTRY, countryName, countrySearchMatches,
} from '../../../lib/agent-crm/countries';

type Option = { code: string; label: string; count: number };

export function CountryFilterSheet({ selected, counts, disabled = false, onApply }: {
  selected: string[];
  counts: Record<string, number>;
  disabled?: boolean;
  onApply: (codes: string[]) => void;
}) {
  const theme = useTheme();
  const styles = useUIStyles();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const options = useMemo<Option[]>(() => Object.entries(counts)
    .filter(([code, count]) => count > 0 && (countryName(code) || code.startsWith('__')))
    .map(([code, count]) => ({
      code,
      label: code === UNSPECIFIED_COUNTRY ? 'Not specified'
        : code === UNRECOGNIZED_COUNTRY ? 'Unrecognized country'
        : countryName(code),
      count,
    }))
    .sort((a, b) => {
      const aSpecial = a.code.startsWith('__'), bSpecial = b.code.startsWith('__');
      return Number(aSpecial) - Number(bSpecial) || a.label.localeCompare(b.label, 'en');
    }), [counts]);
  const visible = useMemo(() => options
    .filter(option => countrySearchMatches(option.label, search) ||
      option.code.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => Number(draft.includes(b.code)) - Number(draft.includes(a.code)) ||
      a.label.localeCompare(b.label, 'en')), [options, draft, search]);

  const openSheet = () => {
    Keyboard.dismiss();
    setDraft(selected);
    setSearch('');
    setOpen(true);
  };
  const close = () => { Keyboard.dismiss(); setOpen(false); setSearch(''); };
  const toggle = (code: string) => setDraft(current => current.includes(code)
    ? current.filter(item => item !== code) : [...current, code]);
  const apply = () => { onApply(draft); close(); };
  const active = selected.length;

  return <>
    <Pressable accessibilityRole="button"
      accessibilityLabel={'Filter by country' + (active ? ', ' + active + ' selected' : '')}
      accessibilityState={{ disabled }}
      disabled={disabled} onPress={openSheet}
      style={{
        // Match the adjacent search field's height in both filter states.
        minWidth: 108, height: 54,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingHorizontal: 10, gap: 8,
        borderRadius: 12, borderWidth: active ? 2 : 1,
        borderColor: active ? theme.primary : theme.border,
        backgroundColor: theme.white, opacity: disabled ? .6 : 1,
      }}>
      <Text style={{ color: active ? theme.primaryDark : theme.ink,
        fontSize: 13, fontWeight: '800' }}>Country</Text>
      {active ? <View style={{
        minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5,
        backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: theme.onPrimary, fontSize: 12, fontWeight: '800' }}>{active}</Text>
      </View> : <View accessibilityElementsHidden importantForAccessibility="no"
        style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2,
          borderColor: theme.muted, transform: [{ rotate: '45deg' }], marginTop: -4,
        }}/>
      </View>}
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss country filters without applying"
          onPress={close} style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
            backgroundColor: 'rgba(7,17,29,.52)',
          }}/>
        <View style={{
          backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: height * .78, paddingTop: 10, paddingHorizontal: 18,
          paddingBottom: Math.max(20, insets.bottom + 12), gap: 12,
        }}>
          <View style={{ width: 38, height: 4, borderRadius: 8,
            backgroundColor: theme.border, alignSelf: 'center' }}/>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.title, { fontSize: 19 }]}>Filter by country</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel country filter changes" onPress={close}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.muted }}>Cancel</Text>
            </Pressable>
          </View>
          <TextInput autoFocus autoCorrect={false} autoCapitalize="none"
            value={search} onChangeText={setSearch} placeholder="Search countries"
            placeholderTextColor={theme.muted}
            style={styles.input} accessibilityLabel="Search countries"/>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.subtitle}>{draft.length ? draft.length + ' selected' : 'All countries'}</Text>
            <Pressable accessibilityRole="button" onPress={() => setDraft([])}>
              <Text style={{ fontWeight: '700', color: theme.primaryDark }}>Clear selection</Text>
            </Pressable>
          </View>
          <FlatList keyboardShouldPersistTaps="handled" data={visible}
            keyExtractor={item => item.code} style={{ flexGrow: 0, flexShrink: 1 }}
            ListEmptyComponent={<Text style={[styles.subtitle, { paddingVertical: 22 }]}>
              {options.length ? 'No matching countries.' : 'No countries in your leads yet.'}
            </Text>}
            renderItem={({ item }) => {
              const checked = draft.includes(item.code);
              return <Pressable accessibilityRole="checkbox"
                accessibilityLabel={item.label + ', ' + item.count + ' leads'}
                accessibilityState={{ checked }} onPress={() => toggle(item.code)}
                style={{
                  minHeight: 52, paddingVertical: 10, borderBottomWidth: .6,
                  borderBottomColor: theme.border, flexDirection: 'row',
                  alignItems: 'center', gap: 12,
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 5, borderWidth: 1.5,
                  borderColor: checked ? theme.primary : theme.border,
                  backgroundColor: checked ? theme.primary : theme.white,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked ? <Text style={{ color: theme.onPrimary, fontWeight: '900' }}>✓</Text> : null}
                </View>
                <Text style={{ flex: 1, color: theme.ink, fontSize: 15 }}>{item.label}</Text>
                <Text style={styles.subtitle}>{item.count}</Text>
              </Pressable>;
            }}/>
          <Pressable accessibilityRole="button" onPress={apply} style={{
            backgroundColor: theme.primary, minHeight: 48,
            borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: theme.onPrimary, fontWeight: '800', fontSize: 15 }}>
              Apply filter
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
