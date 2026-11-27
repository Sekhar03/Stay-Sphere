"use client";

export interface OfflineTenantPass {
  bookingReference: string;
  propertyName: string;
  propertyAddress?: string;
  roomNumber?: string;
  bedNumber?: string;
  monthlyRent?: number;
  moveInDate?: string;
  ownerContact?: string;
  cachedAt: string;
}

const OFFLINE_PASS_KEY = "staysphere_offline_tenant_pass";

/**
 * Persist active booking & room details locally so tenants can view their
 * StaySphere pass even when offline (e.g. inside basements or low-signal PGs).
 */
export function saveOfflinePass(pass: Omit<OfflineTenantPass, "cachedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: OfflineTenantPass = {
      ...pass,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(OFFLINE_PASS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota/storage errors
  }
}

export function getOfflinePass(): OfflineTenantPass | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OFFLINE_PASS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineTenantPass;
  } catch {
    return null;
  }
}

/**
 * Safely register Capacitor Push Notifications when running inside the native shell.
 * No-ops gracefully in web browsers or when the plugin is not installed.
 */
export async function registerPushNotifications(
  onToken?: (token: string) => void
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, any> } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return false;

  const pushPlugin = cap.Plugins?.PushNotifications;
  if (!pushPlugin) return false;

  try {
    const permStatus = await pushPlugin.checkPermissions();
    let receive = permStatus?.receive;
    if (receive === "prompt") {
      const reqStatus = await pushPlugin.requestPermissions();
      receive = reqStatus?.receive;
    }
    if (receive !== "granted") return false;

    if (onToken) {
      pushPlugin.addListener("registration", (token: { value: string }) => {
        if (token?.value) onToken(token.value);
      });
    }
    await pushPlugin.register();
    return true;
  } catch {
    return false;
  }
}
