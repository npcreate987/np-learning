"use client";

import { useEffect } from "react";

/**
 * Wires up native-only behaviour (status bar, splash screen, Android hardware
 * back button). All Capacitor plugins are imported dynamically and guarded by
 * `isNativePlatform()`, so this component is a no-op in the regular browser/PWA.
 *
 * A `cancelled` flag guards against the Strict Mode double-invoke (dev) where
 * the effect is torn down before the dynamic imports resolve — without it the
 * backButton listener from the first invocation would leak and stack up.
 */
export function NativeBridge() {
  useEffect(() => {
    let cancelled = false;
    let listenerRemove: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;

      const [{ StatusBar, Style }, { SplashScreen }, { App }] =
        await Promise.all([
          import("@capacitor/status-bar"),
          import("@capacitor/splash-screen"),
          import("@capacitor/app"),
        ]);
      if (cancelled) return;

      try {
        // Style.Light = light (white) status-bar content, which reads well on
        // the indigo brand background (#4f46e5).
        await StatusBar.setStyle({ style: Style.Light });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#4f46e5" });
        }
      } catch {
        // StatusBar is unavailable on some devices; ignore.
      }

      await SplashScreen.hide();

      if (cancelled) return;
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
      if (cancelled) {
        listener.remove();
        return;
      }
      listenerRemove = () => {
        listener.remove();
      };
    })();

    return () => {
      cancelled = true;
      listenerRemove?.();
    };
  }, []);

  return null;
}
