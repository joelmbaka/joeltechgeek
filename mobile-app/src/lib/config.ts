// Public configuration only. Neon and Google credentials remain server-side.
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://joeltechgeek.com').replace(/\/$/, '');
export const COLORS = {
  primary: '#059669',
  primaryDark: '#047857',
  ink: '#0A2836',
  muted: '#66748B',
  background: '#F6F8FA',
  white: '#FFFFFF',
  border: '#DEE7EA',
  warning: '#F4B843',
  red: '#B42318',
} as const;
