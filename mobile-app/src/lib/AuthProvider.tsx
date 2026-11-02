import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { getAgent, restoreSession, signOutSession, startGoogleSignIn, subscribeSession } from './session';
import { cancelAgentReminders, notificationLeadId, reconcileReminders, requestReminderPermissions } from './notifications';
import type { Agent } from './types';

type AuthContextValue = {
  ready: boolean; agent: Agent | null; login: () => Promise<void>; logout: () => Promise<void>;
  error: string | null;
};
const Context = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(getAgent());
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function restore() {
    setError(null);
    try { await restoreSession(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not reach server.'); }
    finally { setReady(true); }
  }
  useEffect(() => {
    const unsub = subscribeSession(setAgent);
    void restore();
    return unsub;
  }, []);
  useEffect(() => {
    if (!agent) return;
    void requestReminderPermissions().then((enabled) => {
      if (enabled) return reconcileReminders(agent);
    }).catch(() => {});
    const tapped = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data;
      if (data?.crm_agent_id !== agent.id) return;
      const id = notificationLeadId(data);
      if (id) router.push({ pathname: '/leads/[id]', params: { id } });
    });
    void Notifications.getLastNotificationResponseAsync().then((last) => {
      const data = last?.notification.request.content.data;
      if (data?.crm_agent_id !== agent.id) return;
      const id = notificationLeadId(data);
      if (id) router.push({ pathname: '/leads/[id]', params: { id } });
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }).catch(() => {});
    return () => tapped.remove();
  }, [agent, router]);
  const logout = async () => {
    if (agent) await cancelAgentReminders(agent.id).catch(() => {});
    await signOutSession();
    router.replace('/');
  };
  const login = async () => { setError(null); try { await startGoogleSignIn(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); } };
  return <Context.Provider value={{ ready, agent, error, login, logout }}>
    {children}
  </Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}
