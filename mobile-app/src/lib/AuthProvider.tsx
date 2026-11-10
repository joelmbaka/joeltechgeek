import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { getUser, restoreSession, signOutSession, startGoogleSignIn, startPlayReviewSignIn, subscribeSession } from './session';
import { cancelUserReminders, notificationLeadId, notificationRecordId, reconcileReminders, requestReminderPermissions } from './notifications';
import { markCrmNotificationRead, notifyInboxChanged } from './notification-inbox';
import type { CrmUser } from './types';

export type SessionStatus = 'checking' | 'authenticated' | 'signed_out' | 'connection_error';
type AuthContextValue = {
  ready: boolean; user: CrmUser | null; sessionStatus: SessionStatus;
  retryRestore: () => Promise<void>; login: () => Promise<void>;
  reviewLogin: () => Promise<void>; logout: () => Promise<void>;
  error: string | null;
};
const Context = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CrmUser | null>(getUser());
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const restoringRef = useRef(false);
  const router = useRouter();
  const restore = useCallback(async () => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    const userBeforeRestore = getUser();
    setError(null);
    setSessionStatus('checking');
    try {
      const restored = await restoreSession();
      // An OAuth callback can finish while the first restoration is in flight.
      const completedLogin = getUser() && getUser() !== userBeforeRestore;
      setSessionStatus(restored || completedLogin ? 'authenticated' : 'signed_out');
    } catch (err) {
      // An already cached user alone is not proof the server validated it.
      const completedLogin = getUser() && getUser() !== userBeforeRestore;
      if (completedLogin) {
        setSessionStatus('authenticated');
      } else {
        // A connectivity failure is not proof that the saved session expired.
        setError(err instanceof Error ? err.message : 'Could not reach server.');
        setSessionStatus('connection_error');
      }
    } finally {
      restoringRef.current = false;
      setReady(true);
    }
  }, []);
  useEffect(() => {
    const unsub = subscribeSession((next) => {
      setUser(next);
      if (next) {
        setSessionStatus('authenticated');
        setError(null);
      } else {
        // A 401 during normal API use can revoke an already restored session.
        // Do not show sign-in midway through the initial restoration check.
        setSessionStatus(current => current === 'authenticated' ? 'signed_out' : current);
      }
    });
    void restore();
    return unsub;
  }, [restore]);
  useEffect(() => {
    if (!user) return;
    void requestReminderPermissions().then((enabled) => {
      if (enabled) return reconcileReminders(user);
    }).catch(() => {});
    const markOpened = (data: Record<string, unknown> | undefined) => {
      const notificationId = notificationRecordId(data);
      if (notificationId) void markCrmNotificationRead(notificationId).catch(() => {});
    };
    const received = Notifications.addNotificationReceivedListener(() => notifyInboxChanged());
    const tapped = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data;
      if ((data?.crm_user_id ?? data?.crm_agent_id) !== user.id) return;
      const id = notificationLeadId(data);
      markOpened(data);
      if (id) router.push({ pathname: '/leads/[id]', params: { id } });
    });
    void Notifications.getLastNotificationResponseAsync().then((last) => {
      const data = last?.notification.request.content.data;
      if ((data?.crm_user_id ?? data?.crm_agent_id) !== user.id) return;
      const id = notificationLeadId(data);
      markOpened(data);
      if (id) router.push({ pathname: '/leads/[id]', params: { id } });
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }).catch(() => {});
    return () => { tapped.remove(); received.remove(); };
  }, [user, router]);
  // Server/web-scheduled follow-ups can change while this app is backgrounded.
  // Reconcile local Android reminders when the user brings the app to the foreground.
  // Login/session initialization is already handled by the existing effect above.
  useEffect(() => {
    if (!user) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void reconcileReminders(user).catch(() => {});
    });
    return () => subscription.remove();
  }, [user]);

  const logout = async () => {
    if (user) await cancelUserReminders(user.id).catch(() => {});
    await signOutSession();
    setSessionStatus('signed_out');
    setError(null);
    router.replace('/');
  };
  const login = async () => { setError(null); try { await startGoogleSignIn(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); } };
  const reviewLogin = async () => {
    setError(null);
    try { await startPlayReviewSignIn(); }
    catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Review sign-in failed.');
    }
  };
  return <Context.Provider value={{ ready, user, sessionStatus, retryRestore: restore, error, login, reviewLogin, logout }}>
    {children}
  </Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}
