"use client";
import Link from 'next/link';
import { Layout, Menu } from 'antd';
const { Header } = Layout;
import { useEffect, useState } from 'react';

export default function HeaderNav() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        setLoggedIn(meRes.ok);
        // Determine role via GraphQL when logged in
        if (meRes.ok) {
          const res = await fetch('/api/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: 'query{ me { role } }' }) });
          const json = await res.json();
          setIsManager(json?.data?.me?.role === 'MANAGER');
        }
      } catch {
        setLoggedIn(false);
      }
    })();
  }, []);
  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ color: '#fff', fontWeight: 600, marginRight: 24 }}>Shift Tracker</div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectable={false}
        items={[
          { key: 'home', label: <Link href="/">Home</Link> },
          { key: 'clock', label: <Link href="/clock">Clock</Link> },
          ...(isManager ? [{ key: 'manager', label: <Link href="/manager">Manager</Link> }] : []),
          ...(loggedIn ? [{ key: 'logout', label: <a href="/api/auth/logout">Logout</a> }] : [{ key: 'login', label: <a href="/api/auth/login">Login</a> }]),
        ]}
      />
    </Header>
  );
}


