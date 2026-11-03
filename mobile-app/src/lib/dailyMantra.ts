import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Three original, work-focused messages per day. Cycle repeats every 14 days.
// Morning: 7 AM–noon; afternoon: noon–5 PM; evening: 5 PM–7 AM.
const MANTRAS = [
  ['Discipline wins.', 'One more call.', 'Numbers never lie.'],
  ["Excuses don't close deals.", 'Keep showing up.', 'Results are earned.'],
  ['Nobody owes you a win.', 'Chase the next yes.', 'The work never lies.'],
  ['Outwork yesterday.', "Rejection isn't defeat.", 'Count the wins.'],
  ['Work speaks louder.', "Don't stop at no.", 'Every effort counts.'],
  ['Earn your place.', 'Keep the pressure on.', 'Progress is proof.'],
  ['Consistency beats talent.', 'Make another move.', 'The scoreboard speaks.'],
  ['No shortcuts. Just work.', 'Stay hungry.', 'Respect the grind.'],
  ['Show up. Deliver.', 'Push past rejection.', 'Results over excuses.'],
  ['Build your own momentum.', 'Make every call count.', 'Execution wins.'],
  ['Action beats intention.', 'No deal without effort.', 'Let the numbers talk.'],
  ['Raise the standard.', 'Persistence pays.', 'Own your results.'],
  ['Be relentless.', 'The next call matters.', 'Small wins compound.'],
  ['Stay dangerous.', 'Finish what you started.', 'Tomorrow is earned today.'],
] as const;

const DAY_MS = 86_400_000;
// Day 1 of the agreed sequence: Tuesday, November 3, 2026.
const CYCLE_START_DAY = Math.floor(Date.UTC(2026, 10, 3) / DAY_MS);
const BOUNDARY_HOURS = [0, 7, 12, 17] as const;

function dayIndex(date: Date): number {
  // Date.UTC of local calendar components keeps the 14-day sequence stable
  // across DST changes and time-zone offsets.
  const serial = Math.floor(Date.UTC(
    date.getFullYear(), date.getMonth(), date.getDate(),
  ) / DAY_MS);
  return (((serial - CYCLE_START_DAY) % MANTRAS.length) + MANTRAS.length) % MANTRAS.length;
}

export function getDailyMantra(date: Date): string {
  const hour = date.getHours();
  const slot = hour < 7 ? 2 : hour < 12 ? 0 : hour < 17 ? 1 : 2;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // The prior day's evening mantra stays visible until 7 AM.
  if (hour < 7) day.setDate(day.getDate() - 1);
  return MANTRAS[dayIndex(day)][slot].toUpperCase();
}

function nextBoundary(date: Date): Date {
  for (const hour of BOUNDARY_HOURS) {
    const boundary = new Date(
      date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0,
    );
    if (boundary.getTime() > date.getTime()) return boundary;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

/**
 * Updates exactly at local midnight, 7 AM, noon and 5 PM. Also recomputes
 * after returning from the background (when Android may suspend timers).
 * No server, DB, polling requests, or extra dependencies.
 */
export function useDailyMantra() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function refresh() {
      if (timer !== undefined) clearTimeout(timer);
      const current = new Date();
      setNow(current);
      const delay = Math.max(50, nextBoundary(current).getTime() - current.getTime() + 50);
      timer = setTimeout(refresh, delay);
    }
    refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
      else if (timer !== undefined) clearTimeout(timer);
    });
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      listener.remove();
    };
  }, []);
  return { now, mantra: getDailyMantra(now) };
}
