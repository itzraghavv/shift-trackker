import { NextResponse } from 'next/server';
import prisma from '@/prisma';

export async function GET() {
  // For MVP, return the first active perimeter for default org
  const perimeter = await prisma.perimeter.findFirst({ where: { organizationId: 'default-org', active: true } });
  return NextResponse.json(perimeter);
}


