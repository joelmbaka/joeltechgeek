import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/config';
import { useUIStyles } from './ui';

type Mode = 'date' | 'time';

const two = (number: number) => String(number).padStart(2, '0');
function initialDate(mode: Mode, value: string) {
  const current = new Date();
  if (mode === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, date] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, date, 12);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    current.setHours(hours, minutes, 0, 0);
  }
  return current;
}
/** Display local clock time with explicit AM/PM; API storage stays HH:mm. */
function timeLabel(value: string): string {
  if (!/^\d{2}:\d{2}$/.test(value)) return value;
  const [hour, minute] = value.split(':').map(Number);
  return String(hour % 12 || 12) + ':' + two(minute) + (hour < 12 ? ' AM' : ' PM');
}
const format = (mode: Mode, value: Date) =>
  mode === 'date'
    ? [value.getFullYear(), two(value.getMonth() + 1), two(value.getDate())].join('-')
    : two(value.getHours()) + ':' + two(value.getMinutes());

export function NativeSchedulePicker({
  label, mode, value, onChange, disabled = false,
}: {
  label: string;
  mode: Mode;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const styles = useUIStyles();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(new Date());
  const insets = useSafeAreaInsets();
  const open = () => { setDraft(initialDate(mode, value)); setVisible(true); };
  const choose = (date: Date) => {
    setDraft(date);
    if (Platform.OS === 'android') {
      onChange(format(mode, date));
      setVisible(false);
    }
  };
  return <View style={{ flex: 1, gap: 4 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + (value ? ': ' + (mode === 'time' ? timeLabel(value) : value) : ', not set')}
        onPress={open} disabled={disabled}
        style={[styles.input, {
          flex: 1, justifyContent: 'center', minHeight: 46,
          opacity: disabled ? .5 : 1,
        }]}>
        <Text style={{ color: value ? theme.ink : theme.muted, fontWeight: '600' }}>
          {value ? (mode === 'time' ? timeLabel(value) : value) : (mode === 'date' ? 'Choose date' : 'Choose time')}
        </Text>
      </Pressable>
      {value ? <Pressable
        accessibilityRole="button" accessibilityLabel={'Clear ' + label}
        onPress={() => onChange('')} style={{ padding: 8 }}>
        <Text style={{ color: theme.muted }}>×</Text>
      </Pressable> : null}
    </View>
    {visible && Platform.OS === 'android' ?
      <DateTimePicker
        mode={mode} presentation="dialog" value={draft} is24Hour={false}
        onValueChange={(_, next) => choose(next)}
        onDismiss={() => setVisible(false)}
      /> : null}
    {Platform.OS === 'ios' ? <Modal
      transparent statusBarTranslucent={false} visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={() => setVisible(false)}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(7,17,29,.4)' }} />
        <View style={{ paddingHorizontal: 18, paddingTop: 20,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: theme.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
          <Text style={[styles.title, { fontSize: 18, marginBottom: 12 }]}>{label}</Text>
          <DateTimePicker mode={mode} value={draft} is24Hour={false}
            onValueChange={(_, next) => setDraft(next)} />
          <Pressable onPress={() => { onChange(format(mode, draft)); setVisible(false); }}
            style={[styles.button, { marginTop: 12 }]}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal> : null}
  </View>;
}
