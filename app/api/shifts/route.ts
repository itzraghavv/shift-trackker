import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma'

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: {
        startTime: 'desc'
      }
    })
    
    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startTime, employeeId, notes } = body

    const shift = await prisma.shift.create({
      data: {
        startTime: new Date(startTime),
        userId: employeeId,
        organizationId: 'default-org',
        startNote: notes
      }
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}
