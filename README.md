# InsiderWire 📊

An intelligent insider trading signal bot that monitors SEC Form 4 filings, calculates proprietary signal scores, and delivers real-time alerts via Slack with a comprehensive web dashboard.

## Features

- **Automated SEC Form 4 Polling**: Fetches and parses insider trading filings every 2 hours
- **Intelligent Signal Scoring**: Multi-factor scoring algorithm considering transaction size, role, timing, and clustering
- **Real-time Slack Alerts**: Urgent notifications for high-score transactions
- **Daily Digest**: End-of-day summary of all insider trading activity
- **Web Dashboard**: Search, filter, and analyze historical insider transactions
- **90-Day Context**: Track insider activity trends over time

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture documentation with diagrams
- **[PARSER_EXPLAINED.md](./PARSER_EXPLAINED.md)** - How the Form 4 XML parser works (with examples)
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete summary of everything built
- **[SPECS.MD](./SPECS.MD)** - Product specifications and requirements
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for AI assistance

## Architecture

### Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS + DaisyUI
- **Backend**: SST v3 with AWS Lambda cron jobs
- **Database**: PostgreSQL with Drizzle ORM
- **API**: tRPC for type-safe API endpoints
- **Authentication**: Better Auth with session-based authentication

### Key Features

- ✅ **Comprehensive Test Coverage**: Unit tests for SEC parser, scoring engine, and Slack formatters
- ✅ **Authentication Protected**: All dashboard routes and API endpoints require authentication
- ✅ **Rate Limiting**: Built-in SEC API rate limiting (10 req/sec)
- ✅ **Real-time Alerts**: Urgent Slack notifications for high-score transactions
- ✅ **Daily Digests**: Automated end-of-day summaries

### System Components

1. **SEC EDGAR Integration** (`packages/core/src/domain/sec/`)
   - API client for polling Form 4 filings
   - XML parser for extracting transaction data
   - Rate limiting (10 req/sec per SEC guidelines)

2. **Scoring Engine** (`packages/core/src/domain/scoring/`)
   - Base score: Buy (+1), Sell (-1)
   - Size multiplier: log10(value / $10,000)
   - Role multiplier: 1.5× for CEO/CFO/Chairman
   - First activity bonus: +1 for first trade in 180+ days
   - Cluster bonus: +1 per additional insider trading same ticker within 7 days

3. **Processing Pipeline** (`packages/core/src/domain/pipeline/`)
   - Form 4 ingestion and parsing
   - Transaction scoring and database persistence
   - Deduplication handling for amended filings
   - Urgent alert detection and posting

4. **Slack Integration** (`packages/core/src/domain/slack/`)
   - Webhook client for posting messages
   - Rich formatting with Slack Block Kit
   - Threaded daily digests

5. **Web Dashboard** (`packages/web/src/app/dashboard/`)
   - Homepage with recent high-score transactions
   - Filterable transaction list (by ticker, date, score)
   - Ticker detail pages with 90-day stats
   - Transaction detail pages with SEC filing links

6. **Infrastructure** (`infra/`)
   - Form 4 processor cron (every 2 hours)
   - Daily digest cron (6 PM ET)
   - SST v3 AWS deployment configuration

## Database Schema

### Tables

- **issuers**: Companies that file Form 4
  - CIK, ticker, company name

- **insiders**: Reporting owners (scoped per issuer)
  - Name, title, issuer relationship

- **transactions**: Individual Form 4 transactions
  - Date, code (P/S), shares, price, ownership type
  - Signal score, 10b5-1 plan indicator
  - Dedupe constraint on (filing, insider, date, shares, price)

- **slack_alerts**: Audit log of posted alerts
  - Transaction ID, alert type, Slack message timestamp

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL database
- AWS account (for deployment)
- Slack workspace with webhook URL

### 1. Clone and Install

```bash
git clone <repository-url>
cd InsiderWire
pnpm install
```

### 2. Configure Environment

Create `.env.dev` in the root directory:

```bash
# Database
DB_URL=postgres://user:password@host:port/insiderwire

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SEC EDGAR (required by SEC - use your company/contact info)
SEC_EDGAR_USER_AGENT=YourCompany contact@example.com

# Auth (for web dashboard)
BETTER_AUTH_SECRET=your-secret-key-here
RESEND_API_KEY=your-resend-key-here
```

### 3. Set up Database

Generate and run migrations:

```bash
cd packages/core
DATABASE_URL="<your-db-url>" npx drizzle-kit generate
DATABASE_URL="<your-db-url>" npx drizzle-kit migrate
```

### 4. Configure Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to "Incoming Webhooks"
3. Create a new webhook for your desired channel
4. Copy the webhook URL to `.env.dev`

### 5. Run Locally

```bash
# Start development server
pnpm dev

# View dashboard
open http://localhost:3000/dashboard
```

### 6. Deploy to AWS

```bash
# Deploy to dev stage
pnpm sst deploy

# Deploy to production
pnpm sst deploy --stage production
```

## Usage

### Slack Alerts

#### Urgent Alerts

Triggered when:
- Signal score magnitude ≥ 5.0, OR
- Transaction value ≥ $250,000

Alert includes:
- Ticker and company name
- Insider name and title
- Transaction details (shares, price, value)
- Signal score with emoji indicator
- Holdings change percentage
- 10b5-1 plan indicator (if applicable)
- Link to SEC Form 4 filing

#### Daily Digest

Posted once per day at 6 PM ET with:
- Summary stats (total transactions, ticker count)
- Grouped by ticker
- Top 3 insiders per ticker
- Aggregate buy/sell counts and total value

### Web Dashboard

#### Homepage (`/dashboard`)
- Recent high-score transactions (past 7 days)
- Quick access to transaction details

#### All Transactions (`/dashboard/insiders`)
- Filterable list of all transactions
- Filters: ticker, min score, date range
- Paginated results

#### Ticker Detail (`/dashboard/ticker/:symbol`)
- 90-day statistics
- Buy/sell ratio
- Total transaction value
- Average signal score
- Recent transaction list

#### Transaction Detail (`/dashboard/transaction/:id`)
- Complete transaction information
- Insider details
- Post-transaction holdings
- Direct link to SEC Form 4 filing

## Signal Score Examples

### Strong Buy Signal (+7.5)
- CEO buys $500k worth of stock
- First purchase in 6+ months
- 2 other executives also bought within past week
- Score: (1 + 1 + 2) × log10(500000/10000) × 1.5 = 7.05

### Strong Sell Signal (-6.0)
- CFO sells $1M worth of stock
- Direct ownership
- Score: (-1) × log10(1000000/10000) × 1.5 = -6.0

## Project Structure

```
packages/
├── core/                    # Core domain logic
│   ├── src/
│   │   ├── domain/
│   │   │   ├── sec/         # SEC EDGAR integration
│   │   │   ├── scoring/     # Signal score calculator
│   │   │   ├── slack/       # Slack client & formatters
│   │   │   └── pipeline/    # Processing orchestration
│   │   └── sql/
│   │       ├── schema/      # Database schema
│   │       └── queries/     # Database queries
│   └── drizzle.config.ts
├── core-web/                # Web-specific logic (tRPC)
│   └── src/trpc/routers/
│       └── insiders/        # Insider transactions API
├── web/                     # Next.js frontend
│   └── src/
│       ├── app/dashboard/   # Dashboard pages
│       └── components/      # React components
└── functions/               # Lambda handlers
    ├── form4-processor.ts
    └── daily-digest.ts

infra/                       # SST infrastructure
├── config.ts                # Secrets configuration
├── jobs.ts                  # Cron job definitions
└── nextPage.ts              # Next.js app config
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @starter/core test

# Run tests in watch mode
pnpm --filter @starter/core test -- --watch
```

### Test Coverage

The project includes comprehensive test suites for:

#### SEC Parser Tests (`packages/core/src/domain/sec/parser.test.ts`)
- ✅ Valid Form 4 parsing (buy and sell transactions)
- ✅ 10b5-1 plan detection from footnotes
- ✅ Transaction filtering (P/S only)
- ✅ Direct vs indirect ownership
- ✅ Missing optional fields handling
- ✅ Multiple transaction types

#### Scoring Engine Tests (`packages/core/src/domain/scoring/calculator.test.ts`)
- ✅ Base score calculations (buy vs sell)
- ✅ Size multiplier (logarithmic scaling)
- ✅ Role multiplier (CEO/CFO/Chairman = 1.5×)
- ✅ First activity bonus (+1 for 180+ days)
- ✅ Cluster bonus (multiple insiders)
- ✅ Urgent alert thresholds ($250k or |score| ≥ 5.0)
- ✅ Holdings delta calculations
- ✅ Real-world scenario examples

#### Slack Formatter Tests (`packages/core/src/domain/slack/formatters.test.ts`)
- ✅ Urgent alert message formatting
- ✅ Daily digest formatting
- ✅ Holdings delta display
- ✅ 10b5-1 plan indicators
- ✅ SEC filing links
- ✅ Missing field handling

### Test Examples

```typescript
// Example: Testing scoring calculation
it("should match example: Strong Buy Signal", () => {
  const input: ScoreInput = {
    transactionCode: "P",
    transactionValue: 500_000,
    insiderTitle: "CEO",
    isFirstActivityIn180Days: true,
    additionalInsidersInCluster: 2,
  };

  const result = calculateSignalScore(input);

  // (1 + 1 + 2) × log10(50) × 1.5 ≈ 10.20
  expect(result.score).toBeCloseTo(10.2, 1);
});
```

## Authentication

### User Authentication

All dashboard routes and API endpoints are protected by Better Auth:

#### Middleware Protection
- **Next.js Middleware** (`packages/web/src/middleware.ts`) - Redirects unauthenticated users to sign-in
- Public routes: `/`, `/auth/sign-in`, `/auth/sign-up`
- Protected routes: `/dashboard/*`, `/onboarding/*`

#### API Protection
- **tRPC Procedures** - All `insiders.*` endpoints use `protectedProcedure`
- Returns `UNAUTHORIZED` error if no valid session
- Session validated via Better Auth

#### User Flow
1. User visits `/dashboard` without authentication
2. Middleware detects no session
3. Redirects to `/auth/sign-in?callbackUrl=/dashboard`
4. After sign-in, user is redirected back to original URL
5. Protected tRPC endpoints verify session on every request

### Creating Your First User

```bash
# Start the dev server
pnpm dev

# Visit http://localhost:3000/auth/sign-up
# Create an account with email/password
# You'll be redirected to /dashboard
```

## SEC Compliance

- User-Agent header required for all SEC requests (identifies your application)
- Rate limit: 10 requests per second (enforced by client)
- Respect SEC's fair access policy
- Form 4 filings are public information

## Troubleshooting

### Tests Failing

If tests fail after installation:
```bash
# Ensure dependencies are installed
pnpm install

# Run tests with verbose output
pnpm --filter @starter/core test -- --reporter=verbose
```

### Authentication Issues

If you're redirected to sign-in repeatedly:
1. Check that `BETTER_AUTH_SECRET` is set in `.env.dev`
2. Clear browser cookies for localhost
3. Check browser console for errors
4. Verify database migrations ran successfully

### Database Connection

If you can't connect to the database:
```bash
# Check PostgreSQL is running
docker ps

# Test connection
psql "postgres://postgres:postgres@localhost:5937/insiderwire"

# Recreate database if needed
cd packages/core
pnpm run db:nuke:up:migrate
```

## License

MIT

---

Built with ❤️ using [SST](https://sst.dev), [Next.js](https://nextjs.org), and [pnpm workspaces](https://pnpm.io)
