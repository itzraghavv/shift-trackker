"use client";
import Link from 'next/link';
import { Layout, Menu } from 'antd';
const { Header } = Layout;

export default function HeaderNav() {
  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ color: '#fff', fontWeight: 600, marginRight: 24 }}>Shift Tracker</div>
      <Menu theme="dark" mode="horizontal" selectable={false} items={[
        { key: 'home', label: <Link href="/">Home</Link> },
        { key: 'clock', label: <Link href="/clock">Clock</Link> },
        { key: 'manager', label: <Link href="/manager">Manager</Link> },
        { key: 'login', label: <a href="/api/auth/login">Login</a> },
        { key: 'logout', label: <a href="/api/auth/logout">Logout</a> },
      ]} />
    </Header>
  );
}


