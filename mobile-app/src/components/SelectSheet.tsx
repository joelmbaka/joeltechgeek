import { useMemo, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text,
  TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/config';
import { useUIStyles } from './ui';

export type SelectOption = { value: string; label: string; icon?: string; count?: number };

function ChevronDown() {
  const theme = useTheme();
  return <View
    accessibilityElementsHidden
    importantForAccessibility="no"
    style={{
      width: 17, height: 17, alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
    <View style={{
      width: 8, height: 8, borderBottomWidth: 1.6, borderRightWidth: 1.6,
      borderColor: theme.muted, transform: [{ rotate: '45deg' }],
      marginTop: -4,
    }}/>
  </View>;
}

export function SelectSheet({
  title, value, options, onChange, searchable = false,
  disabled = false, placeholder, compact = false, onCreateOption, dismissKeyboardOnOpen = false,
  hideTriggerLabel = false,
}: {
  title: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  onCreateOption?: (name: string) => Promise<string>;
  dismissKeyboardOnOpen?: boolean;
  /** Keep the sheet title for accessibility and the modal; render only its selected value in a row. */
  hideTriggerLabel?: boolean;
}) {
  const theme = useTheme();
  const styles = useUIStyles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [createError, setCreateError] = useState('');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label || placeholder || 'Select';
  const visible = useMemo(() => options.filter((option) =>
    (option.label + ' ' + option.value).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [options, query]);
  const existingCategories = useMemo(() => [...new Set(options
    .filter((option) => option.value !== '')
    .map((option) => option.label))], [options]);

  const close = () => {
    if (savingNew) return;
    setOpen(false);
    setQuery('');
    setAdding(false);
    setShowAllCategories(false);
    setNewName('');
    setCreateError('');
  };
  const saveNew = async () => {
    const name = newName.trim().replace(/\s+/g, ' ');
    if (!onCreateOption || !name || savingNew) return;
    if (existingCategories.some((category) =>
      category.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setCreateError('Category already exists.');
      return;
    }
    setSavingNew(true);
    setCreateError('');
    try {
      const savedName = await onCreateOption(name);
      onChange(savedName);
      setSavingNew(false);
      // Close explicitly: the close() callback still captures savingNew=true here.
      setOpen(false);
      setQuery('');
      setAdding(false);
      setShowAllCategories(false);
      setNewName('');
      setCreateError('');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Could not save category.');
      setSavingNew(false);
    }
  };

  return <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + ', ' + selectedLabel}
      disabled={disabled}
      onPress={() => { if (dismissKeyboardOnOpen) Keyboard.dismiss(); setOpen(true); }}
      style={compact ? {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        minHeight: 36, maxWidth: 195, borderRadius: 10,
        borderWidth: 1, borderColor: theme.border, backgroundColor: theme.white,
        paddingHorizontal: 10, gap: 5, opacity: disabled ? .55 : 1,
      } : [styles.input, {
        justifyContent: 'center', minHeight: hideTriggerLabel ? 44 : 58,
        paddingVertical: 8, opacity: disabled ? .55 : 1,
      }]}>
      {compact ? <>
        <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '600' }}>Sort:</Text>
        <Text numberOfLines={1} style={{
          color: theme.ink, fontSize: 12, fontWeight: '700', flexShrink: 1,
        }}>{selectedLabel}</Text>
        <ChevronDown/>
      </> : <>
        {!hideTriggerLabel ? <Text style={[styles.label, { marginBottom: 2 }]}>{title}</Text> : null}
        <View style={{ paddingRight: 19, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text numberOfLines={1} style={{ color: theme.ink, fontWeight: '700', flexShrink: 1 }}>
            {selectedLabel}
            {selected?.count !== undefined ? ' (' + selected.count + ')' : ''}
          </Text>
          {selected?.icon ? <Text accessibilityElementsHidden
            style={{fontSize:17}}>{selected.icon}</Text> : null}
        </View>
        <View pointerEvents="none" style={{
          position: 'absolute', right: 10, top: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronDown/>
        </View>
      </>}
    </Pressable>
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}
      statusBarTranslucent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' || adding ? 'padding' : undefined}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Close selection"
          onPress={close}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
            backgroundColor: 'rgba(7,17,29,.52)',
          }}
        />
        <View style={{
          backgroundColor: theme.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: height * .78, paddingHorizontal: 18, paddingTop: 10,
          paddingBottom: Math.max(20, insets.bottom + 12),
        }}>
          <View style={{
            width: 38, height: 4, borderRadius: 8,
            backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14,
          }}/>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 12,
          }}>
            <Text style={[styles.title, { fontSize: 19 }]}>{adding ? 'New category' : title}</Text>
            <Pressable onPress={close} accessibilityRole="button"
              accessibilityLabel="Close sheet" hitSlop={12}>
              <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 16 }}>Done</Text>
            </Pressable>
          </View>
          {searchable && !adding ? <TextInput
            autoCorrect={false} autoCapitalize="none"
            value={query} onChangeText={setQuery}
            placeholder={'Search ' + title.toLowerCase()}
            placeholderTextColor={theme.muted}
            style={[styles.input, { marginBottom: 8 }]}
          /> : null}
          {adding && onCreateOption ? <View style={{ gap: 14, paddingVertical: 10 }}>
            <View style={{ gap: 5 }}>
              <Text style={styles.label}>Category name</Text>
              <TextInput value={newName}
                onChangeText={(text) => { setNewName(text); setCreateError(''); }}
                autoFocus autoCorrect={false} maxLength={100}
                placeholder="Enter category name" placeholderTextColor={theme.muted}
                style={styles.input}
                onSubmitEditing={() => void saveNew()} returnKeyType="done"/>
              {createError ? <Text style={styles.error}>{createError}</Text> : null}
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>Your existing categories</Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>{existingCategories.length} total</Text>
              </View>
              {existingCategories.length === 0 ? <Text style={styles.subtitle}>No categories yet.</Text> :
                <ScrollView nestedScrollEnabled style={showAllCategories ? { maxHeight: Math.min(170, height * .23) } : undefined}
                  keyboardShouldPersistTaps="handled">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 3 }}>
                    {(showAllCategories ? existingCategories : existingCategories.slice(0, 5)).map((name) =>
                      <View key={name} style={{ backgroundColor: theme.background, borderRadius: 20,
                        borderWidth: .5, borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <Text style={{ color: theme.ink, fontSize: 12 }}>{name}</Text>
                      </View>)}
                  </View>
                </ScrollView>}
              {existingCategories.length > 5 ? <Pressable accessibilityRole="button"
                onPress={() => setShowAllCategories((current) => !current)}>
                <Text style={{ color: theme.primaryDark, fontWeight: '700', fontSize: 13 }}>
                  {showAllCategories ? 'Show fewer' : 'Show all ' + existingCategories.length + ' categories'}
                </Text>
              </Pressable> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', paddingTop: 10 }}>
              <Pressable accessibilityRole="button" disabled={savingNew}
                onPress={() => { setAdding(false); setShowAllCategories(false); setNewName(''); setCreateError(''); }}
                style={{ paddingVertical: 11, paddingHorizontal: 14 }}>
                <Text style={{ color: theme.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={savingNew || !newName.trim()}
                onPress={() => void saveNew()}
                style={{ paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10,
                  backgroundColor: theme.primary, opacity: savingNew || !newName.trim() ? .5 : 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  {savingNew ? 'Saving…' : 'Save category'}
                </Text>
              </Pressable>
            </View>
          </View> : !adding && onCreateOption ? <Pressable accessibilityRole="button"
            onPress={() => { setAdding(true); setShowAllCategories(false); setNewName(''); setCreateError(''); }}
            style={{ paddingVertical: 15, borderBottomColor: theme.border, borderBottomWidth: 1 }}>
            <Text style={{ color: theme.primaryDark, fontWeight: '800', fontSize: 15 }}>
              + Add new category
            </Text>
          </Pressable> : null}
          {!adding ? <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}>
            {visible.map((option) => <Pressable key={option.value}
              accessibilityRole="button" accessibilityState={{ selected: value === option.value }}
              onPress={() => { onChange(option.value); close(); }}
              style={{
                paddingVertical: 15, minHeight: 51,
                borderBottomColor: theme.border, borderBottomWidth: .6,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
              <Text numberOfLines={2} style={{
                color: value === option.value ? theme.primaryDark : theme.ink,
                fontWeight: value === option.value ? '800' : '500',
                flex: 1, fontSize: 15,
              }}>
                {option.label}
                {option.count !== undefined ? ' (' + option.count + ')' : ''}
              </Text>
              {option.icon ? <Text accessibilityElementsHidden
                style={{fontSize:18,marginLeft:10}}>{option.icon}</Text> : null}
              {value === option.value ?
                <Text style={{ color: theme.primary, fontWeight: '900', marginLeft:6 }}>✓</Text> : null}
            </Pressable>)}
            {visible.length === 0 ? <Text style={styles.subtitle}>No matching options.</Text> : null}
          </ScrollView> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
