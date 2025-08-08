"use client";
import { useEffect, useRef } from 'react';

export default function Notifications({ enabled }: { enabled: boolean }) {
  const requested = useRef(false);
  useEffect(() => {
    if (!enabled || requested.current) return;
    requested.current = true;
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);
  return null;
}


