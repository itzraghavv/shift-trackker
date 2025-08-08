"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLocationContext } from '@/app/providers';

export default function AutoGeofence() {
  const { location, perimeterCenter, geofenceMeters } = useLocationContext();
  const [lastInside, setLastInside] = useState<boolean | null>(null);

  const inside = useMemo(() => {
    if (!location || !perimeterCenter || !geofenceMeters) return null;
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(perimeterCenter.lat - location.lat);
    const dLng = toRad(perimeterCenter.lng - location.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(location.lat)) * Math.cos(toRad(perimeterCenter.lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= geofenceMeters;
  }, [location, perimeterCenter, geofenceMeters]);

  useEffect(() => {
    if (inside == null) return;
    if (lastInside == null) {
      setLastInside(inside);
      return;
    }
    if (inside !== lastInside && Notification?.permission === 'granted') {
      if (inside) new Notification('You entered the perimeter. You can clock in now.');
      else new Notification('You left the perimeter. Remember to clock out.');
    }
    setLastInside(inside);
  }, [inside, lastInside]);

  return null;
}


