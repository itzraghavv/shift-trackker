# Shift Tracker

Care worker clock-in/out app with perimeter geofencing.

Tech:
- Next.js App Router + Ant Design
- GraphQL (Yoga) API at `/api/graphql`
- Prisma + PostgreSQL
- Auth0 authentication (`/api/auth/*`)
- Chart.js for analytics

## Local setup

1) Create `.env.local`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shift_tracker"
AUTH0_SECRET="your-random-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://YOUR_TENANT.eu.auth0.com"
AUTH0_CLIENT_ID="YOUR_CLIENT_ID"
AUTH0_CLIENT_SECRET="YOUR_CLIENT_SECRET"
```

2) Start Postgres via Docker:

```
docker run --name shift-tracker-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shift_tracker -p 5432:5432 -d postgres:16
```

3) Install deps and push schema:

```
pnpm install
pnpm db:generate
pnpm db:push
```

4) Dev server:

```
pnpm dev
```

Open `http://localhost:3000`.
