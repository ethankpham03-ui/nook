'use client';

export type FocusNotificationResult = 'shown' | 'denied' | 'unavailable' | 'failed';

type FocusNotificationContent = {
  body: string;
  title: string;
};

const FOCUS_NOTIFICATION_TAG = 'nook-focus-session';

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration && process.env.NODE_ENV === 'production') {
    registration = await navigator.serviceWorker.register('/sw.js');
  }
  if (!registration) return null;
  return navigator.serviceWorker.ready;
}

export async function showFocusNotification(
  content: FocusNotificationContent,
  { requestPermission = false }: { requestPermission?: boolean } = {},
): Promise<FocusNotificationResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unavailable';

  try {
    let permission = Notification.permission;
    if (permission === 'default' && requestPermission) {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'unavailable';

    const registration = await getReadyRegistration();
    if (!registration) return 'unavailable';
    await registration.showNotification(content.title, {
      body: content.body,
      data: { url: '/#focus' },
      icon: '/icons/icon-192.png',
      tag: FOCUS_NOTIFICATION_TAG,
    });
    return 'shown';
  } catch {
    return 'failed';
  }
}

export async function dismissFocusNotification(): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const registration = await getReadyRegistration();
    const notifications = await registration?.getNotifications({ tag: FOCUS_NOTIFICATION_TAG });
    notifications?.forEach((notification) => notification.close());
  } catch {
    // Notification cleanup is best-effort and must never affect the timer.
  }
}
