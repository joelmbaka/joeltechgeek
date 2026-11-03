import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';

/** Refetch on navigation focus and on returning to the foreground; never poll. */
export function useFreshOnFocus(load: (signal: AbortSignal) => void, deps: readonly unknown[]) {
  useFocusEffect(useCallback(() => {
    let controller = new AbortController();
    load(controller.signal);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        controller.abort();
        controller = new AbortController();
        load(controller.signal);
      }
    });
    return () => { controller.abort(); subscription.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps));
}
