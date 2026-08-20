import { useCallback, useEffect, useState } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, []);

  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions): Promise<Notification | undefined> => {
      if (!('Notification' in window)) return undefined;

      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestPermission();
      }

      if (currentPermission === 'granted') {
        const notification = new Notification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options,
        });
        // Auto-close after 6 seconds
        setTimeout(() => notification.close(), 6000);
        return notification;
      }

      return undefined;
    },
    [permission, requestPermission]
  );

  return { permission, requestPermission, sendNotification };
}
