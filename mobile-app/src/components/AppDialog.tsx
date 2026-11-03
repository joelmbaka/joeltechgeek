import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/lib/config';

type DialogOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
};
type DialogContextValue = { showDialog: (options: DialogOptions) => void };
const Context = createContext<DialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const showDialog = useCallback((options: DialogOptions) => setDialog(options), []);

  const confirm = () => {
    const action = dialog?.onConfirm;
    setDialog(null);
    // Dialog closes immediately; the caller owns any async loading state.
    if (action) void Promise.resolve().then(action).catch(() => {
      setDialog({ title: 'Action unavailable',
        message: 'The action could not be completed. Please try again.' });
    });
  };
  return <Context.Provider value={{ showDialog }}>
    {children}
    <Modal visible={dialog !== null} transparent animationType="fade"
      statusBarTranslucent={false} onRequestClose={() => setDialog(null)}>
      <StatusBar style={dark ? 'light' : 'dark'} translucent={false}
        backgroundColor={dark ? '#0A2836' : '#FFFFFF'}/>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Dismiss dialog"
          onPress={() => setDialog(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: theme.overlay }}/>
        {dialog ? <View accessibilityViewIsModal
          style={{
            width: '100%', maxWidth: 372, padding: 22, gap: 12,
            backgroundColor: theme.white, borderColor: theme.border,
            borderWidth: 1, borderRadius: 22, elevation: 10,
            shadowColor: '#000000', shadowRadius: 22,
            shadowOpacity: dark ? .4 : .18, shadowOffset: { width: 0, height: 8 },
          }}>
          <View style={{
            width: 38, height: 5, borderRadius: 8,
            backgroundColor: theme.primary, marginBottom: 4,
          }}/>
          <Text accessibilityRole="header" style={{
            color: theme.ink, fontSize: 20, fontWeight: '800',
          }}>{dialog.title}</Text>
          <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21 }}>
            {dialog.message}
          </Text>
          <View style={{
            flexDirection: dialog.onConfirm && (dialog.confirmLabel?.length || 0) > 14
              ? 'column-reverse' : 'row',
            justifyContent: 'flex-end', gap: 10, marginTop: 10,
          }}>
            {dialog.onConfirm ? <Pressable
              accessibilityRole="button"
              onPress={() => setDialog(null)}
              style={{ borderWidth: 1, borderColor: theme.border,
                backgroundColor: theme.white, borderRadius: 11,
                minHeight: 44, paddingHorizontal: 16, alignItems: 'center',
                justifyContent: 'center' }}>
              <Text style={{ color: theme.ink, fontWeight: '700', fontSize: 14 }}>
                {dialog.cancelLabel || 'Cancel'}
              </Text>
            </Pressable> : null}
            <Pressable accessibilityRole="button" onPress={confirm}
              style={{ backgroundColor: theme.primary, borderRadius: 11,
                minHeight: 44, paddingHorizontal: 18, alignItems: 'center',
                justifyContent: 'center' }}>
              <Text style={{ color: theme.onPrimary, fontWeight: '800', fontSize: 14 }}>
                {dialog.confirmLabel || 'OK'}
              </Text>
            </Pressable>
          </View>
        </View> : null}
      </View>
    </Modal>
  </Context.Provider>;
}

export function useAppDialog() {
  const context = useContext(Context);
  if (!context) throw new Error('AppDialogProvider is missing');
  return context.showDialog;
}
