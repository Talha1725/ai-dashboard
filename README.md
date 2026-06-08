# AI Dashboard

Business health dashboard for cashflow, profit, overtime, delivery status, and payment alerts.

## Tech Stack

- Next.js with TypeScript
- Tailwind CSS
- Next.js Route Handlers for backend APIs
- PostgreSQL with Prisma
- XLSX parsing for cashflow uploads

## Local Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then generate Prisma client:

```bash
npm run db:generate
```

Run database migrations once Postgres is available:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

## Backend Routes

- `GET /api/metrics` returns the latest cached dashboard snapshot.
- `POST /api/metrics/refresh` refreshes dashboard data from configured connectors.
- `POST /api/cashflow/upload` accepts an Excel file field named `file` and updates cashflow weeks.

## Phase 1 Status

Backend foundation is in place:

- Prisma schema for metric snapshots, refresh logs, and cashflow uploads
- Connector placeholders for MYOB, Connect Team, and the internal job tracking app
- Excel workbook parser for the cashflow source
- Metrics service with database fallback to mock data until Postgres/API credentials are configured

## Required Client Inputs

- MYOB API credentials and API documentation
- Connect Team API endpoint and API key
- Internal job tracking app source/API documentation
- Sample Excel cashflow spreadsheet
- PostgreSQL database URL
