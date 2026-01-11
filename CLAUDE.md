# CLAUDE.md

This file provides guidance when working with code in this repository.

## Project Overview

Starter is a minimal monorepo template with SST v3, Next.js, Drizzle, tRPC, and Better Auth. All product-specific features have been removed so it can be used as a clean starting point.

## Architecture

### Monorepo Structure
- **packages/core**: Auth schema, Drizzle setup, minimal queries (user, organization)
- **packages/core-web**: Better Auth config, tRPC context, routers (user, organization)
- **packages/web**: Next.js app with auth pages, onboarding, simple dashboard shell
- **packages/ext**: Browser extension shell (example; update APIs as needed)
- **infra/**: SST configuration for the Next.js app

### Key Technologies
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: SST v3 + Next.js routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with organizations
- **API**: tRPC

## Common Development Commands

### Core Development
```bash
# Start development environment
pnpm dev

# Type checking across all packages
pnpm typecheck

# Database operations (adjust stage/urls as needed)
pnpm --filter @starter/core db:migrate:local    # Run migrations locally
pnpm --filter @starter/core db:generate:migrations  # Generate new migrations

# Run tests
pnpm --filter @starter/core test
```

### Extension Development
```bash
# Build browser extension
pnpm --filter ext dev
```

## Database
Auth tables only (users, accounts, sessions, verifications, organizations, members, invitations). Migrations should be regenerated for your project.

## API Structure

### tRPC (packages/core-web/src/trpc/)
- **user**: current user
- **organization**: basic org + invitations

### REST (packages/web/src/app/api/)
- **auth/[...all]/route.ts**: Better Auth handler
- **trpc/[trpc]/route.ts**: tRPC handler

## Development Guidelines

### Code Style
- Uses Biome for formatting and linting
- Tab indentation, double quotes for strings
- TypeScript strict mode enabled

### Testing
- Vitest for unit testing (use `sst shell vitest`)
- Tests located alongside source files

### Environment Setup
- Environment variables via dotenvx (see infra/config.ts for secrets)
- Development uses `.env.dev` (you will supply DB + auth secrets)

## Important File Locations

- **Database schema**: `packages/core/src/sql/schema/`
- **tRPC routers**: `packages/core-web/src/trpc/routers/`
- **Chat components**: `packages/core-web/src/components/chat/`
- **AI processing**: `packages/core/src/domain/ai/`
- **Infrastructure**: `infra/` directory and `sst.config.ts`