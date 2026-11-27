import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'in.staysphere.app',
  appName: 'StaySphere',
  webDir: 'public',
  server: {
    // Set NEXT_PUBLIC_APP_URL for release builds (e.g. https://staysphere.in)
    // Defaults to Android emulator host loopback in local development
    url: appUrl,
    cleartext: !appUrl.startsWith('https://'),
  },
};

export default config;
