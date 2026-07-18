// Web Push helper for TAXIGO PWA
// Works on Chrome/Edge/Firefox (Android + Desktop) and Safari (iOS 16.4+)

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof window !== "undefined" ? window.atob(base64) : "";
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getSubscriptionStatus(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  const permission = (Notification as any).permission as "granted" | "denied" | "default";
  return permission;
}

export async function subscribeToPush(role: "owner" | "driver" | "passenger" = "owner", label: string = "", user_id?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isPushSupported()) return { ok: false, error: "Twoja przeglądarka nie obsługuje powiadomień. iOS wymaga wersji 16.4+" };
    // 1) request permission
    let perm: NotificationPermission = (Notification as any).permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
      if (perm !== "granted") return { ok: false, error: "Odmówiono dostępu do powiadomień" };
    }
    // 2) register service worker
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    // 3) get VAPID public key from backend
    const keyRes = await fetch(`${BACKEND}/api/push/vapid-public-key`);
    const keyData = await keyRes.json();
    if (!keyData.configured || !keyData.publicKey) return { ok: false, error: "Serwer nie ma skonfigurowanych powiadomień" };
    // 4) subscribe
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    });
    // 5) send subscription to backend
    const resp = await fetch(`${BACKEND}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), role, label, user_id: user_id || undefined }),
    });
    if (!resp.ok) return { ok: false, error: "Błąd zapisu subskrypcji" };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Błąd" };
  }
}

// Silently ensures the current browser is subscribed to push and tagged with the given
// role + user_id. Never asks for permission — only runs if user already granted it.
export async function ensureSilentSubscription(role: "driver" | "passenger", user_id?: string, label: string = ""): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    if ((Notification as any).permission !== "granted") return false;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const keyRes = await fetch(`${BACKEND}/api/push/vapid-public-key`);
    const keyData = await keyRes.json();
    if (!keyData.configured || !keyData.publicKey) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
    }
    await fetch(`${BACKEND}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), role, label, user_id: user_id || undefined }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch(`${BACKEND}/api/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }
    return true;
  } catch {
    return false;
  }
}
