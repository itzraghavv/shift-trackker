"use client";
import { Alert } from 'antd';

export default function GeofenceNotice({ inside }: { inside: boolean }) {
  if (inside) return null;
  return <Alert type="warning" message="You are outside the allowed perimeter. Clock-in is disabled." showIcon />;
}


