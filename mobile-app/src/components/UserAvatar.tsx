import { useEffect, useState } from 'react';
import { Image, Text, View, useColorScheme } from 'react-native';
import { useTheme } from '@/lib/config';

type Props = {
  name: string;
  pictureUrl?: string | null;
  size?: number;
};

/** Display the signed-in Google profile photo without uploading it anywhere. */
export function UserAvatar({ name, pictureUrl, size = 32 }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const dark = useColorScheme() === 'dark';
  const theme = useTheme();
  useEffect(() => setLoadFailed(false), [pictureUrl]);

  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  return <View style={{
    width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
    borderWidth: 1, borderColor: dark ? '#456071' : theme.border,
    backgroundColor: dark ? '#20475A' : '#E6F5EF',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <Text style={{
      color: dark ? '#B8F1DA' : theme.primaryDark,
      fontSize: Math.round(size * 0.4),
      fontWeight: '800',
    }}>{initial}</Text>
    {pictureUrl && !loadFailed ? <Image
      source={{ uri: pictureUrl }}
      resizeMode="cover"
      onError={() => setLoadFailed(true)}
      accessible={false}
      style={{ position: 'absolute', width: size, height: size,
        borderRadius: size / 2 }}
    /> : null}
  </View>;
}
