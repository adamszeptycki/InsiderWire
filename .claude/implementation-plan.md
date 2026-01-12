# InsiderWire Implementation Plan

## Overview
Build an insider trading signal bot that monitors SEC Form 4 filings, scores them based on multiple factors, and delivers alerts via Slack. The system will poll SEC EDGAR, parse Form 4 XML, calculate signal scores, and send both urgent real-time alerts and daily digests.

## Architecture

### Infrastructure Components (SST v3)
1. **Cron Job** - Poll SEC EDGAR API every 4-6 hours for Form 4 filings
2. **Queue + Worker** - Process Form 4 XML parsing and scoring asynchronously
3. **Database** - PostgreSQL via Drizzle ORM (existing setup)
4. **Slack Integration** - Post alerts and daily digests

### Database Schema

#### `issuers` table
- `id` (uuid, PK)
- `cik` (text, unique, indexed) - SEC Central Index Key
- `ticker` (text, indexed)
- `company_name` (text)
- `created_at`, `updated_at` (timestamps)

#### `insiders` table
- `id` (uuid, PK)
- `issuer_id` (uuid, FK to issuers)
- `name` (text)
- `title` (text, nullable)
- `created_at`, `updated_at` (timestamps)
- Unique constraint on `(name, issuer_id)` - identity scoped per issuer

#### `transactions` table
- `id` (uuid, PK)
- `filing_accession` (text, indexed)
- `insider_id` (uuid, FK to insiders)
- `issuer_id` (uuid, FK to issuers)
- `transaction_date` (date, indexed)
- `transaction_code` (text) - 'P' or 'S'
- `shares` (decimal)
- `price` (decimal)
- `transaction_value` (decimal) - computed: shares × price
- `post_transaction_shares` (decimal)
- `is_direct_ownership` (boolean)
- `is_10b5_1` (boolean) - parsed from footnotes
- `signal_score` (decimal)
- `created_at`, `updated_at` (timestamps)
- Unique constraint on `(filing_accession, insider_id, transaction_date, shares, price)` - dedupe key

#### `slack_alerts` table
- `id` (uuid, PK)
- `transaction_id` (uuid, FK to transactions)
- `issuer_id` (uuid, FK to issuers)
- `alert_type` (text) - 'urgent' or 'digest'
- `slack_thread_ts` (text, nullable) - for threading daily digests
- `slack_message_ts` (text, nullable) - timestamp of posted message
- `posted_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

### Implementation Phases

## Phase 1: Database Schema & Core Models
**Location**: `packages/core/src/sql/schema/`

1. Create `insiders.ts` with issuers, insiders, transactions, slack_alerts tables
2. Export from `packages/core/src/sql/schema/index.ts`
3. Generate and run migrations
4. Create Zod schemas for validation

**Files to create**:
- `packages/core/src/sql/schema/insiders.ts`

## Phase 2: SEC EDGAR Integration
**Location**: `packages/core/src/domain/sec/`

1. Create SEC EDGAR API client
   - Poll recent Form 4 filings (https://www.sec.gov/cgi-bin/browse-edgar)
   - Fetch Form 4 XML by accession number
   - Handle rate limiting (10 requests/second)

2. XML Parser for Form 4
   - Extract issuer info (CIK, ticker, company name)
   - Extract insider info (name, title, relationship)
   - Parse transactions (code, date, shares, price, ownership)
   - Parse footnotes for 10b5-1 mentions
   - Handle amended filings (overwrite logic)

**Files to create**:
- `packages/core/src/domain/sec/client.ts` - SEC API client
- `packages/core/src/domain/sec/parser.ts` - Form 4 XML parser
- `packages/core/src/domain/sec/types.ts` - Type definitions

## Phase 3: Scoring Engine
**Location**: `packages/core/src/domain/scoring/`

Implement scoring algorithm per specs:
- Base score: Buy (+1), Sell (-1)
- Size multiplier: `log10(transaction_value / 10,000)`
- Role multiplier: CEO/CFO/Chair (×1.5)
- First activity bonus: First trade in ≥180 days (+1)
- Cluster bonus: ≥2 insiders same ticker within 7 days (+1 per additional)

**Files to create**:
- `packages/core/src/domain/scoring/calculator.ts` - Score calculation
- `packages/core/src/domain/scoring/rules.ts` - Alert trigger rules

## Phase 4: Database Queries
**Location**: `packages/core/src/sql/queries/insiders/`

1. Mutations:
   - `upsertIssuer()` - Insert or update issuer
   - `upsertInsider()` - Insert or update insider
   - `upsertTransaction()` - Insert or update transaction (dedupe logic)
   - `recordSlackAlert()` - Record alert posting

2. Queries:
   - `getInsiderLastTransaction()` - For first activity detection
   - `getRecentTransactionsByTicker()` - For cluster detection
   - `getDailyTransactionsByTicker()` - For daily digest aggregation
   - `getInsiderHoldingsHistory()` - For holdings delta calculation

**Files to create**:
- `packages/core/src/sql/queries/insiders/mutations.ts`
- `packages/core/src/sql/queries/insiders/queries.ts`

## Phase 5: Slack Integration
**Location**: `packages/core/src/domain/slack/`

1. Slack client for posting messages
2. Message formatting:
   - **Urgent Alert**: Rich format with ticker, insider, transaction details, signal score, SEC filing link
   - **Daily Digest**: Threaded reply with summary stats and bullet list per insider

**Files to create**:
- `packages/core/src/domain/slack/client.ts` - Slack API client
- `packages/core/src/domain/slack/formatters.ts` - Message formatting functions

## Phase 6: Processing Pipeline
**Location**: `packages/core/src/domain/pipeline/`

1. Main orchestrator function:
   - Fetch recent Form 4 filings from SEC
   - For each filing:
     - Parse XML
     - Filter to P/S transactions only
     - Upsert issuer, insider, transactions
     - Calculate signal score
     - Check urgent alert rules
     - Post urgent alerts to Slack if triggered

2. Daily digest aggregator:
   - Run once per day (separate cron schedule)
   - Group transactions by ticker and date
   - Calculate aggregate stats
   - Post digest to Slack as threaded reply

**Files to create**:
- `packages/core/src/domain/pipeline/processor.ts` - Main processing pipeline
- `packages/core/src/domain/pipeline/aggregator.ts` - Daily digest logic

## Phase 7: Infrastructure Setup
**Location**: `infra/`

1. Create SST Cron for SEC polling
   - Schedule: Every 4-6 hours
   - Handler: Call processor pipeline

2. Create SST Cron for daily digest
   - Schedule: Once daily (e.g., 6 PM ET)
   - Handler: Call aggregator

3. Add Slack webhook URL secret
4. Optional: Create Queue for async processing if needed

**Files to create/modify**:
- `infra/jobs.ts` - Cron job definitions
- `infra/config.ts` - Add SLACK_WEBHOOK_URL secret
- `sst.config.ts` - Import jobs

## Phase 8: Web Dashboard
**Location**: `packages/web/src/app/dashboard/`, `packages/core-web/src/trpc/routers/`

1. tRPC Router for insider data:
   - `listTransactions()` - Paginated list with filters (ticker, date range, signal score)
   - `getTransactionDetails()` - Single transaction with insider/issuer context
   - `getTickerStats()` - Aggregate stats for a ticker (90-day context)
   - `searchTickers()` - Autocomplete for ticker search

2. Dashboard pages:
   - `/dashboard` - Main view with recent high-score transactions
   - `/dashboard/ticker/[symbol]` - Ticker-specific view with history
   - `/dashboard/transaction/[id]` - Transaction detail view

3. UI Components:
   - Transaction list table (sortable, filterable)
   - Signal score badge/indicator
   - Insider profile card
   - 90-day activity chart

**Files to create**:
- `packages/core-web/src/trpc/routers/insiders/router.ts`
- `packages/core-web/src/trpc/routers/insiders/functions.ts`
- `packages/core-web/src/trpc/routers/insiders/schema.ts`
- `packages/web/src/app/dashboard/insiders/page.tsx`
- `packages/web/src/app/dashboard/ticker/[symbol]/page.tsx`
- `packages/web/src/components/insiders/TransactionList.tsx`
- `packages/web/src/components/insiders/SignalScoreBadge.tsx`

## Phase 9: Testing & Validation
1. Unit tests for:
   - XML parser edge cases
   - Scoring calculation
   - Alert rule triggering

2. Integration tests:
   - End-to-end pipeline with sample Form 4 XML
   - Database operations
   - Slack message formatting

## Key Design Decisions

### 1. Polling vs Webhooks
**Decision**: Use scheduled polling (cron every 4-6 hours)
**Rationale**: SEC EDGAR doesn't provide webhooks; RSS feed is available but polling is simpler and more reliable

### 2. Sync vs Async Processing
**Decision**: Start with synchronous processing in cron handler
**Rationale**: Form 4 volume is low (<100/day typical); can add queue later if needed

### 3. Slack Threading Strategy
**Decision**: One thread per ticker per day, daily digest as reply
**Rationale**: Keeps channel organized; urgent alerts start threads, digests summarize

### 4. Dedupe Strategy
**Decision**: Composite unique constraint on transaction table
**Rationale**: Handles amended filings (same accession) and prevents duplicate alerts

### 5. Holdings Delta Calculation
**Decision**: Store `post_transaction_shares` and query previous transaction
**Rationale**: More reliable than trying to maintain running balance; handles missing data gracefully

## User Decisions

1. **Slack Configuration**: ✅ Use Incoming Webhook URL (simple, no OAuth)
2. **Polling Frequency**: ✅ Every 2 hours (good balance of freshness and API courtesy)
3. **Alert Thresholds**: ✅ Use spec'd thresholds ($250k, 10% holdings change)
4. **Frontend Dashboard**: ✅ Build a simple web dashboard with search and filters

## Environment Variables Needed

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SEC_EDGAR_USER_AGENT=MyCompany contact@example.com  # Required by SEC
```

## Estimated Complexity
- **Database Schema**: Low complexity
- **SEC Integration**: Medium complexity (XML parsing, rate limiting)
- **Scoring Engine**: Low-medium complexity (clear algorithm)
- **Slack Integration**: Low complexity
- **Pipeline Orchestration**: Medium complexity (error handling, dedupe)

## Success Criteria
1. ✅ Daily Form 4 filings are ingested and parsed correctly
2. ✅ Signal scores match spec calculation
3. ✅ Urgent alerts trigger correctly and post to Slack in real-time
4. ✅ Daily digests aggregate correctly and post as threaded replies
5. ✅ Deduplication prevents duplicate alerts
6. ✅ System handles edge cases (missing prices, amended filings, etc.)
