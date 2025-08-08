"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Space, Table, Typography } from 'antd';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { useLocationContext } from '@/app/providers';
import AuthGuard from '@/app/(components)/AuthGuard';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

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

export default function ManagerPage() {
  const orgId = 'default-org';
  const { setPerimeter } = useLocationContext();
  const [perimeters, setPerimeters] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [staffHours, setStaffHours] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await gql<{ perimeters: any[]; shifts: any[]; dashboard: any[]; staffHours: any[] }>(
        `query($orgId: ID!){ perimeters(orgId:$orgId){ id name centerLat centerLng radiusMeters active } shifts(orgId:$orgId){ id userId startTime endTime } dashboard(orgId:$orgId){ date count avgHours } staffHours(orgId:$orgId){ userId hours } }`,
        { orgId }
      );
      setPerimeters(data.perimeters);
      setShifts(data.shifts);
      setDashboard(data.dashboard);
      setStaffHours(data.staffHours);
    })();
  }, []);

  const onFinish = async (values: any) => {
    const input = { ...values, orgId };
    const data = await gql<{ upsertPerimeter: any }>(
      `mutation($input: UpsertPerimeterInput!){ upsertPerimeter(input:$input){ id name centerLat centerLng radiusMeters active } }`,
      { input }
    );
    setPerimeters((prev) => {
      const idx = prev.findIndex((p) => p.id === data.upsertPerimeter.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = data.upsertPerimeter;
        return copy;
      }
      return [data.upsertPerimeter, ...prev];
    });
    setPerimeter({ lat: data.upsertPerimeter.centerLat, lng: data.upsertPerimeter.centerLng }, data.upsertPerimeter.radiusMeters);
  };

  const chartData = useMemo(() => ({
    labels: dashboard.map((d) => d.date),
    datasets: [
      { label: 'Clock-ins', data: dashboard.map((d) => d.count), borderColor: '#1677ff', backgroundColor: 'rgba(22,119,255,0.2)' },
      { label: 'Avg Hours', data: dashboard.map((d) => d.avgHours), borderColor: '#52c41a', backgroundColor: 'rgba(82,196,26,0.2)' },
    ],
  }), [dashboard]);

  return (
    <AuthGuard>
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Typography.Title level={3}>Manager</Typography.Title>
        <Card title="Set Perimeter">
          <Form layout="vertical" onFinish={onFinish} initialValues={{ name: 'Main Hospital', centerLat: 0, centerLng: 0, radiusMeters: 2000 }}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Center Latitude" name="centerLat" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} step={0.0001} />
            </Form.Item>
            <Form.Item label="Center Longitude" name="centerLng" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} step={0.0001} />
            </Form.Item>
            <Form.Item label="Radius (meters)" name="radiusMeters" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} step={50} />
            </Form.Item>
            <Button type="primary" htmlType="submit">Save Perimeter</Button>
          </Form>
        </Card>

        <Card title="Clocked-in Staff">
          <Table
            size="small"
            dataSource={shifts.filter((s) => !s.endTime)}
            rowKey={(r) => r.id}
            columns={[
              { title: 'User', dataIndex: 'userId' },
              { title: 'Start Time', dataIndex: 'startTime' },
            ]}
          />
        </Card>

        <Card title="Dashboard (last 7 days)">
          <Line data={chartData} />
        </Card>

        <Card title="Total Hours per Staff (last 7 days)">
          <Table
            size="small"
            dataSource={staffHours}
            rowKey={(r) => r.userId}
            columns={[
              { title: 'User', dataIndex: 'userId' },
              { title: 'Hours', dataIndex: 'hours' },
            ]}
          />
        </Card>
      </Space>
    </div>
    </AuthGuard>
  );
}


