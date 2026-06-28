import type { CapacitorConfig } from "@capacitor/cli";

// The native app loads the live web build from CAP_SERVER_URL (LAN IP during
// dev, production domain for release). When unset, it falls back to the static
// offline screen bundled in `capacitor/www`.
const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.nplearning.app",
  appName: "NP Learning",
  webDir: "capacitor/www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          // Allow plain http only when explicitly pointing at an http URL
          // (e.g. a LAN IP during development).
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#4f46e5",
      showSpinner: false,
    },
  },
};

export default config;
