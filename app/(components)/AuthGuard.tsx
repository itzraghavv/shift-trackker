"use client";
import { PropsWithChildren, useEffect, useState } from 'react';

export default function AuthGuard({ children }: PropsWithChildren) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 200) setOk(true);
        else window.location.href = '/api/auth/login';
      } catch {
        window.location.href = '/api/auth/login';
      }
    })();
  }, []);
  if (!ok) return null;
  return children as any;
}


