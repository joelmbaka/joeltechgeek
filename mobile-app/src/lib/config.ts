import { useColorScheme } from 'react-native';

// Public configuration only. Neon and Google credentials remain server-side.
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://joeltechgeek.com').replace(/\/$/, '');

const LIGHT = {
  primary: '#059669', primaryDark: '#047857', onPrimary: '#FFFFFF',
  ink: '#0A2836', muted: '#596F7D', background: '#F6F8FA',
  white: '#FFFFFF', surfaceMuted: '#EFF4F6', border: '#DCE5E9',
  warning: '#9B650D', red: '#9B650D',
  chipHighBg: '#E6F5EB', chipHighBorder: '#A5D7B7', chipHighText: '#176B42',
  chipNormalBg: '#FFF5DF', chipNormalBorder: '#EBD398', chipNormalText: '#81590E',
  dueBg: '#FFF0F0', dueBorder: '#E8A0A0', dueText: '#A52E35',
  chipLowBg: '#EFF3F7', chipLowBorder: '#CED7E0', chipLowText: '#53687A',
  overlay: 'rgba(6,17,27,.50)',
} as const;
const DARK: typeof LIGHT | Record<keyof typeof LIGHT, string> = {
  primary: '#2ACA94', primaryDark: '#5CE3AC', onPrimary: '#062419',
  ink: '#F3F8F9', muted: '#A9BDC8', background: '#071925',
  white: '#102C3B', surfaceMuted: '#183849', border: '#345566',
  warning: '#F4C97A', red: '#F4C97A',
  chipHighBg: '#123E33', chipHighBorder: '#377F64', chipHighText: '#8AE4B8',
  chipNormalBg: '#3B311C', chipNormalBorder: '#78623B', chipNormalText: '#F4CB7D',
  dueBg: '#4A242C', dueBorder: '#AD5964', dueText: '#FFADB7',
  chipLowBg: '#263A49', chipLowBorder: '#4C6676', chipLowText: '#BED2DF',
  overlay: 'rgba(0,7,12,.68)',
};
export type AppTheme = { [K in keyof typeof LIGHT]: string };
export const COLORS: AppTheme = LIGHT;
export function useTheme(): AppTheme {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}
