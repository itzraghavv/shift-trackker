"use client";
import { Select } from 'antd';

export default function OrgSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  // For MVP, static single org
  return (
    <Select style={{ minWidth: 220 }} value={value} onChange={onChange} options={[{ value: 'default-org', label: 'Default Org' }]} />
  );
}


