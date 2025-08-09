"use client";
import { Tag } from 'antd';

export default function ClockStatus({ inside }: { inside: boolean }) {
  return inside ? <Tag color="green">Inside perimeter</Tag> : <Tag color="red">Outside perimeter</Tag>;
}


