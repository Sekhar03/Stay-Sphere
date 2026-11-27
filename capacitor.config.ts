import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.staysphere.app',
  appName: 'StaySphere',
  webDir: 'public',
  server: {
    // In production set your deployed domain e.g. https://staysphere.in
    // In development connects to your local machine / network IP
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  },
};

export default config;
