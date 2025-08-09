"use client";
import Link from "next/link";
import { Button, Card, Space, Typography } from "antd";

export default function Home() {
  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Typography.Title level={3}>Shift Tracker</Typography.Title>
          <Typography.Paragraph>
            Simple clock-in/clock-out for care workers with perimeter geofencing.
          </Typography.Paragraph>
          <Space wrap>
            <Link href="/clock">
              <Button type="primary">Clock In / Out</Button>
            </Link>
            <Link href="/manager">
              <Button>Manager Dashboard</Button>
            </Link>
            <a href="/api/auth/login">
              <Button>Login</Button>
            </a>
            <a href="/api/auth/logout">
              <Button>Logout</Button>
            </a>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
