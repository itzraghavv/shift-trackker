import { createYoga, createSchema } from 'graphql-yoga';
import { DateTimeResolver } from 'graphql-scalars';
import prisma from '@/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum Role { MANAGER CARE_WORKER }
  enum OrgRole { ADMIN STAFF }

  type User { id: ID!, email: String!, name: String, role: Role, createdAt: DateTime }
  type Organization { id: ID!, name: String! }
  type Perimeter { id: ID!, name: String!, centerLat: Float!, centerLng: Float!, radiusMeters: Int!, active: Boolean! }
  type Shift {
    id: ID!
    userId: ID!
    organizationId: ID!
    startTime: DateTime!
    startLat: Float
    startLng: Float
    startNote: String
    endTime: DateTime
    endLat: Float
    endLng: Float
    endNote: String
  }

  type DayStats { date: String!, count: Int!, avgHours: Float! }
  type StaffHours { userId: ID!, hours: Float! }

  type Query {
    me: User
    myActiveShift(orgId: ID!): Shift
    shifts(orgId: ID!): [Shift!]!
    perimeters(orgId: ID!): [Perimeter!]!
    dashboard(orgId: ID!): [DayStats!]!
    staffHours(orgId: ID!): [StaffHours!]!
  }

  input ClockInInput { orgId: ID!, lat: Float, lng: Float, note: String }
  input ClockOutInput { lat: Float, lng: Float, note: String }
  input UpsertPerimeterInput { id: ID, orgId: ID!, name: String!, centerLat: Float!, centerLng: Float!, radiusMeters: Int!, active: Boolean }

  type Mutation {
    clockIn(input: ClockInInput!): Shift!
    clockOut(input: ClockOutInput!): Shift!
    upsertPerimeter(input: UpsertPerimeterInput!): Perimeter!
  }
`;

const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    me: async (_: unknown, __: unknown, ctx: any) => {
      if (!ctx.userId) return null;
      return prisma.user.findUnique({ where: { id: ctx.userId } });
    },
    myActiveShift: async (_: unknown, { orgId }: { orgId: string }, ctx: any) => {
      if (!ctx.userId) return null;
      return prisma.shift.findFirst({
        where: { userId: ctx.userId, organizationId: orgId, endTime: null },
        orderBy: { startTime: 'desc' },
      });
    },
    shifts: async (_: unknown, { orgId }: { orgId: string }) => {
      return prisma.shift.findMany({ where: { organizationId: orgId }, orderBy: { startTime: 'desc' } });
    },
    perimeters: async (_: unknown, { orgId }: { orgId: string }) => {
      return prisma.perimeter.findMany({ where: { organizationId: orgId, active: true } });
    },
    dashboard: async (_: unknown, { orgId }: { orgId: string }) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const shifts = await prisma.shift.findMany({ where: { organizationId: orgId, startTime: { gte: oneWeekAgo } } });
      const byDay: Record<string, { count: number; totalHours: number; ended: number }> = {};
      for (const s of shifts) {
        const d = new Date(s.startTime);
        const key = d.toISOString().slice(0, 10);
        const hours = s.endTime ? (Number(s.endTime) - Number(s.startTime)) / 36e5 : 0;
        byDay[key] = byDay[key] || { count: 0, totalHours: 0, ended: 0 };
        byDay[key].count += 1;
        if (s.endTime) {
          byDay[key].totalHours += hours;
          byDay[key].ended += 1;
        }
      }
      return Object.entries(byDay).map(([date, v]) => ({ date, count: v.count, avgHours: v.ended ? v.totalHours / v.ended : 0 }));
    },
    staffHours: async (_: unknown, { orgId }: { orgId: string }) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const shifts = await prisma.shift.findMany({ where: { organizationId: orgId, startTime: { gte: oneWeekAgo } } });
      const byUser: Record<string, number> = {};
      for (const s of shifts) {
        if (s.endTime) {
          const hours = (Number(s.endTime) - Number(s.startTime)) / 36e5;
          byUser[s.userId] = (byUser[s.userId] || 0) + hours;
        }
      }
      return Object.entries(byUser).map(([userId, hours]) => ({ userId, hours }));
    },
  },
  Mutation: {
    clockIn: async (_: unknown, { input }: any, ctx: any) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      const { orgId, lat, lng, note } = input;
      // Ensure no active shift exists
      const active = await prisma.shift.findFirst({ where: { userId: ctx.userId, organizationId: orgId, endTime: null } });
      if (active) throw new Error('Already clocked in');
      return prisma.shift.create({
        data: {
          userId: ctx.userId,
          organizationId: orgId,
          startTime: new Date(),
          startLat: lat,
          startLng: lng,
          startNote: note,
        },
      });
    },
    clockOut: async (_: unknown, { input }: any, ctx: any) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      const { lat, lng, note } = input;
      const shift = await prisma.shift.findFirst({ where: { userId: ctx.userId, endTime: null }, orderBy: { startTime: 'desc' } });
      if (!shift) throw new Error('No active shift');
      return prisma.shift.update({
        where: { id: shift.id },
        data: { endTime: new Date(), endLat: lat, endLng: lng, endNote: note },
      });
    },
    upsertPerimeter: async (_: unknown, { input }: any, ctx: any) => {
      // For simplicity, allow any authenticated user for now; in real app, check admin rights
      if (!ctx.userId) throw new Error('Unauthorized');
      const { id, orgId, name, centerLat, centerLng, radiusMeters, active } = input;
      if (id) {
        return prisma.perimeter.update({
          where: { id },
          data: { name, centerLat, centerLng, radiusMeters, active: active ?? true },
        });
      }
      return prisma.perimeter.create({
        data: { organizationId: orgId, name, centerLat, centerLng, radiusMeters, active: active ?? true },
      });
    },
  },
};

const yoga = createYoga<{ req: NextRequest }>({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/api/graphql',
  context: async ({ req }) => {
    // Map Auth0 user to our User id
    const session = await getSession();
    const sub = session?.user?.sub;
    if (!sub) return {};
    const user = await prisma.user.findUnique({ where: { auth0Id: sub } });
    return { userId: user?.id };
  },
});

export const { handleRequest } = yoga;
export { handleRequest as GET, handleRequest as POST };


