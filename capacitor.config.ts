import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.saoke.chitieu',
  appName: 'Sao Kê Chi Tiêu',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#eef4fb',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
