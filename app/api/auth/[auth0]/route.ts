import { handleAuth, handleCallback, AfterCallbackAppRoute } from '@auth0/nextjs-auth0';
import prisma from '@/prisma';

const afterCallback: AfterCallbackAppRoute = async (req, session, state) => {
  const auth0Id = session.user.sub;
  const email = session.user.email ?? '';
  const name = session.user.name ?? session.user.nickname ?? '';

  if (auth0Id && email) {
    await prisma.user.upsert({
      where: { auth0Id },
      update: { email, name },
      create: { auth0Id, email, name },
    });
  }
  return session;
};

const authHandler = handleAuth({
  callback: handleCallback({ afterCallback }),
});

// Next.js 15: dynamic route params are async
export async function GET(req: Request, ctx: { params: Promise<{ auth0: string }> }) {
  const params = await ctx.params;
  // Pass resolved params to the underlying handler
  return authHandler(req, { params });
}

export { GET as POST };


