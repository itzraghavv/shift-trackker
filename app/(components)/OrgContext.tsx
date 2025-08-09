"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocationContext } from '@/app/providers';

type OrgContextValue = {
  orgId: string;
};

const OrgContext = createContext<OrgContextValue>({ orgId: 'default-org' });

export function useOrg() { return useContext(OrgContext); }

export default function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgId] = useState('default-org');
  const { setPerimeter } = useLocationContext();

  useEffect(() => {
    // Fetch perimeter for org
    (async () => {
      const res = await fetch('/api/geofence');
      const p = await res.json();
      if (p) setPerimeter({ lat: p.centerLat, lng: p.centerLng }, p.radiusMeters);
    })();
  }, [setPerimeter]);

  return <OrgContext.Provider value={{ orgId }}>{children}</OrgContext.Provider>;
}


