#!/usr/bin/env python3
"""Apply Bridgeframe branding to the current JoelTechGeek Expo app on mobile branch.
Safe for re-run; only alters app.json, src/app/_layout.tsx, and src/app/index.tsx.
"""
from pathlib import Path
import json

app = Path(__file__).resolve().parents[1]
config_path = app / 'app.json'
config = json.loads(config_path.read_text(encoding='utf8'))
expo = config['expo']
expo['icon'] = './assets/images/icon.png'
expo['ios']['icon'] = {
    'light': './assets/images/ios-icon-light.png',
    'dark': './assets/images/ios-icon-dark.png',
    'tinted': './assets/images/ios-icon-tinted.png',
}
expo['android']['adaptiveIcon'] = {
    'foregroundImage': './assets/images/android-icon-foreground.png',
    'monochromeImage': './assets/images/android-icon-monochrome.png',
    'backgroundColor': '#0A2836',
}
for plugin in expo['plugins']:
    if isinstance(plugin, list) and plugin[0] == 'expo-splash-screen':
        plugin[1].update({
            'backgroundColor': '#F8FAFC',
            'image': './assets/images/splash-icon.png',
            'imageWidth': 180,
            'resizeMode': 'contain',
            'dark': {
                'backgroundColor': '#0A2836',
                'image': './assets/images/splash-icon-dark.png'
            },
        })
config_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + '\n', encoding='utf8')

layout = app / 'src/app/_layout.tsx'
s = layout.read_text(encoding='utf8')
if "import { Image, useColorScheme } from 'react-native';" not in s:
    old = "import { useColorScheme } from 'react-native';"
    if old not in s:
        raise RuntimeError('Unexpected React Native import in root layout')
    s = s.replace(old, "import { Image, useColorScheme } from 'react-native';")
if "import { AuthProvider, useAuth } from '@/lib/AuthProvider';" not in s:
    old = "import { AuthProvider } from '@/lib/AuthProvider';"
    if old not in s:
        raise RuntimeError('Unexpected AuthProvider import in root layout')
    s = s.replace(old, "import { AuthProvider, useAuth } from '@/lib/AuthProvider';")
if '  const { agent } = useAuth();' not in s:
    s = s.replace('function Navigation() {',
                  'function Navigation() {\n  const { agent } = useAuth();')
old_header = "        title: 'Joel Tech Geek CRM',"
new_header = """        title: '',
        headerShown: !!agent,
        headerTitleAlign: 'left',
        headerTitle: () => <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={dark ? require('../../assets/images/header-logo-dark.png') : require('../../assets/images/header-logo.png')}
          style={{ width: 34, height: 34 }}
          resizeMode="contain"
          accessibilityLabel="JoelTechGeek" />,"""
if old_header in s:
    s = s.replace(old_header, new_header)
elif 'headerTitle: () => <Image' not in s:
    raise RuntimeError('Could not locate original header title')
layout.write_text(s, encoding='utf8')

home = app / 'src/app/index.tsx'
s = home.read_text(encoding='utf8')
old_import = "import { Alert, FlatList, Linking, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';"
new_import = "import { Alert, FlatList, Image, Linking, Pressable, RefreshControl, Text, TextInput, View, useColorScheme } from 'react-native';"
if old_import in s:
    s = s.replace(old_import, new_import)
elif new_import not in s:
    raise RuntimeError('Unexpected React Native import in index screen')
if '  const brandScheme = useColorScheme();' not in s:
    needle = '  const { ready, agent, login, reviewLogin'
    if needle not in s:
        raise RuntimeError('Could not locate auth hook in index screen')
    s = s.replace(needle, '  const brandScheme = useColorScheme();\n' + needle)
old_auth = '      <Text style={styles.title}>Joel Tech Geek CRM</Text>'
new_auth = """      <Image
        source={brandScheme === 'dark'
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          ? require('../../assets/images/auth-logo-dark.png')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          : require('../../assets/images/auth-logo.png')}
        style={{ width: 108, height: 108, alignSelf: 'center' }}
        resizeMode="contain"
        accessibilityLabel="JoelTechGeek logo" />
      <Text style={[styles.title, { textAlign: 'center' }]}>JoelTechGeek CRM</Text>"""
if old_auth in s:
    s = s.replace(old_auth, new_auth)
elif 'accessibilityLabel="JoelTechGeek logo"' not in s:
    raise RuntimeError('Could not locate original auth title')
home.write_text(s, encoding='utf8')
print('Branding applied: app.json, native home header, signed-out screen.')
