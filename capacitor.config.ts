import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.advansistechnologies.lidapay',
  appName: 'lidapay',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      // launchAutoHide: true,
      backgroundColor: "#de0f17",
      // androidSplashResourceName: "splash",
      // androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    }
  }
};

export default config;
