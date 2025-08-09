"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Notifications from './(components)/Notifications';
import { ConfigProvider, App as AntApp, theme } from 'antd';

type Location = { lat: number; lng: number } | null;

type LocationContextValue = {
  location: Location;
  geofenceMeters: number | null;
  perimeterCenter: { lat: number; lng: number } | null;
  setPerimeter: (center: { lat: number; lng: number }, radiusMeters: number) => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('LocationContext not available');
  return ctx;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location>(null);
  const [perimeterCenter, setPerimeterCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [geofenceMeters, setGeofenceMeters] = useState<number | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const setPerimeter = (center: { lat: number; lng: number }, radiusMeters: number) => {
    setPerimeterCenter(center);
    setGeofenceMeters(radiusMeters);
  };

  const value = useMemo(() => ({ location, geofenceMeters, perimeterCenter, setPerimeter }), [location, geofenceMeters, perimeterCenter]);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <AntApp>
        <LocationContext.Provider value={value}>
          <Notifications enabled={true} />
          {children}
        </LocationContext.Provider>
      </AntApp>
    </ConfigProvider>
  );
}


