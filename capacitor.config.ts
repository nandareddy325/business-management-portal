import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gkcrm.app',
  appName: 'GK CRM',
  server: {
    url: 'https://business-management-portal-fq61.vercel.app',
    cleartext: true
  }
};

export default config;