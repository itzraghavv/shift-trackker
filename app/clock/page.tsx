"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, Alert, Tag } from 'antd';
import AuthGuard from '@/app/(components)/AuthGuard';
import { useLocationContext } from '@/app/providers';

async function gql<T>(query: string, variables?: any): Promise<T> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL Error');
  return json.data as T;
}

export default function ClockPage() {
  const { location, perimeterCenter, geofenceMeters } = useLocationContext();
  const [note, setNote] = useState('');
  const [orgId, setOrgId] = useState<string>('default-org');
  const [status, setStatus] = useState<'idle' | 'in' | 'out'>('idle');
  const [error, setError] = useState<string | null>(null);

  const distanceMeters = useMemo(() => {
    if (!location || !perimeterCenter) return null;
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(perimeterCenter.lat - location.lat);
    const dLng = toRad(perimeterCenter.lng - location.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(location.lat)) * Math.cos(toRad(perimeterCenter.lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [location, perimeterCenter]);

  const inside = useMemo(() => {
    if (distanceMeters == null || geofenceMeters == null) return true;
    return distanceMeters <= geofenceMeters;
  }, [distanceMeters, geofenceMeters]);

  useEffect(() => {
    // Load active shift
    (async () => {
      try {
        const data = await gql<{ myActiveShift: { id: string } | null }>(
          `query($orgId: ID!){ myActiveShift(orgId:$orgId){ id } }`,
          { orgId }
        );
        setStatus(data.myActiveShift ? 'in' : 'out');
      } catch (e) {}
    })();
  }, [orgId]);

  const doClockIn = async () => {
    setError(null);
    try {
      if (!inside) throw new Error('You are outside the perimeter');
      await gql(
        `mutation($input: ClockInInput!){ clockIn(input:$input){ id } }`,
        { input: { orgId, lat: location?.lat, lng: location?.lng, note } }
      );
      setStatus('in');
      setNote('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const doClockOut = async () => {
    setError(null);
    try {
      await gql(
        `mutation($input: ClockOutInput!){ clockOut(input:$input){ id } }`,
        { input: { lat: location?.lat, lng: location?.lng, note } }
      );
      setStatus('out');
      setNote('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <AuthGuard>
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Typography.Title level={3}>Clock In / Out</Typography.Title>
          {error && <Alert type="error" message={error} />}
          {geofenceMeters != null && (
            <Typography.Text>
              {inside ? <Tag color="green">Inside perimeter</Tag> : <Tag color="red">Outside perimeter</Tag>}
              {distanceMeters != null && ` • Distance: ${distanceMeters.toFixed(0)} m`}
            </Typography.Text>
          )}
          <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" rows={3} />
          <Space>
            <Button type="primary" disabled={status === 'in'} onClick={doClockIn}>
              Clock In
            </Button>
            <Button danger disabled={status === 'out'} onClick={doClockOut}>
              Clock Out
            </Button>
          </Space>
          <Typography.Paragraph type="secondary">Ensure you are logged in. Geolocation must be enabled on your device.</Typography.Paragraph>
        </Space>
      </Card>
    </div>
    </AuthGuard>
  );
}


