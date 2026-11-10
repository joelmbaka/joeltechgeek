#!/usr/bin/env python3
"""Reapply the existing artwork configuration for the CallsBound Expo app.

This intentionally leaves the app name, UI strings, OAuth scheme, package IDs,
and artwork files unchanged. Safe to re-run on the mobile branch.
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

print('CallsBound asset configuration applied; names, UI and identifiers preserved.')
