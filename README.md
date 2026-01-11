# Starter Template

Minimal monorepo scaffold with Better Auth, tRPC, Drizzle, Next.js, and SST v3.
Use this as a clean starting point for new projects.

## Stack
- Frontend: Next.js 15, React, Tailwind
- Auth: Better Auth (email/password) with organizations
- API: tRPC
- DB: Postgres + Drizzle ORM
- Infra: SST v3 (Next.js site only)
- Extension: browser extension shell (no backend coupling)

## Packages
- `packages/core` — Drizzle schema (auth tables), DB access
- `packages/core-web` — Better Auth config, tRPC context/routers (user, organization)
- `packages/web` — Next.js app (auth pages, onboarding shell, dashboard shell)
- `packages/ext` — extension shell

## Setup
```bash
pnpm install
```

Set env (example):
```
BETTER_AUTH_SECRET=dev-secret
RESEND_API_KEY=stub
DB_URL=postgres://postgres:postgres@localhost:5937/starter
NEXT_PUBLIC_BASE_URL=https://localhost:3000
BETTER_AUTH_URL=https://localhost:3000
```

## Scripts
- `pnpm dev` — start Next.js (via SST) for web
- `pnpm typecheck` — type check all packages
- `pnpm test` — run tests (none included yet)

## Database
- Drizzle config in `packages/core`
- Migrations directory is empty; generate your own:
  ```bash
  pnpm --filter @starter/core db:generate:migrations
  pnpm --filter @starter/core db:migrate:local
  ```

## Notes
- Email/invitation sending is stubbed; integrate your provider in:
  - `packages/core-web/src/auth/invitation/email.ts`
  - `packages/web/src/server/auth/email.ts`
- Middleware/instrumentation are minimal; extend as needed.
# Lucidiant (AirFrame) 🧠

An AI-powered document processing and chat application with RAG (Retrieval-Augmented Generation) capabilities and visual workflow automation. Transform your business data into actionable insights through natural language queries and automated data pipelines.

## 🚀 Features

### 📄 Document Intelligence
- **Universal Document Processing**: Support for PDFs, Word docs, PowerPoints, spreadsheets, and more via `markitdown` and `docling`
- **OCR Capabilities**: Extract text from images and scanned documents
- **Smart Chunking**: Intelligent text segmentation for optimal retrieval
- **Vector Embeddings**: Powered by OpenAI embeddings and Qdrant vector database
- **RAG Chat System**: Ask questions about your documents in natural language

### 🔄 Visual Workflow Builder (FlowBuilder)
Build visual data pipelines with 60+ pre-built integrations:

- **Storage & Databases**: AWS S3, PostgreSQL, MongoDB, BigQuery, Snowflake, Redis, Elasticsearch
- **Documentation**: Google Drive, Notion, Confluence, Microsoft 365, Dropbox, Box
- **Development**: GitHub, GitLab, Jira, Linear, Asana, Trello, CircleCI, Jenkins
- **Communication**: Slack, Microsoft Teams, Discord, Gmail, Zoom, Google Meet
- **CRM & Sales**: Salesforce, HubSpot, Zendesk, Intercom, Pipedrive
- **Analytics & BI**: Google Analytics, Tableau, PowerBI, Looker, Mixpanel, Segment
- **Logic & Control**: AI transforms, filters, conditions, loops, delays, merges

### 🏢 Enterprise Features
- **Multi-tenant Architecture**: Organization-based access control
- **User Management**: Invitations, roles, and permissions
- **Authentication**: Secure auth system with Better-auth
- **Real-time Chat**: Streaming AI responses with source attribution
- **Knowledge Graphs**: Neo4j-powered relationship mapping

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, Node.js Lambda functions
- **Database**: PostgreSQL with Drizzle ORM
- **Vector DB**: Qdrant for embeddings storage
- **Graph DB**: Neo4j for knowledge graphs
- **Infrastructure**: AWS (SST v3), S3, SQS, Lambda
- **AI/ML**: OpenAI GPT models, LangChain, embeddings
- **Auth**: Better-auth with organization support
- **Package Manager**: pnpm workspaces
- **Deployment**: SST v3 (Serverless Stack Toolkit)

## 📁 Project Structure

```
├── packages/
│   ├── core/                 # Core business logic, database schemas, domain models
│   ├── core-web/            # Shared UI components, auth, tRPC routers
│   ├── web/                 # Next.js web application
│   ├── ext/                 # Chrome extension (development/may be abandoned)
│   ├── functions/           # AWS Lambda functions for background processing
├── infra/                   # SST infrastructure configuration
├── airframe/                # Python FastAPI backend for document processing
└── [Root workspace files]
```

### Package Details

- **`@airframe/core`**: Database schemas (Drizzle), domain logic, AI utilities, queue handlers
- **`core-web`**: Shared React components, authentication, tRPC API routers, UI library
- **`web`**: Main Next.js application with dashboard, chat interface, and workflow builder
- **`ext`**: Browser extension for content extraction (currently under development)
- **`functions`**: Serverless functions for document processing, embeddings, webhooks

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+ with UV
- Docker and Docker Compose
- AWS CLI configured
- PostgreSQL (local via Docker or remote)

### 1. Clone and Install

```bash
git clone [repository-url]
cd airframe
pnpm install
```

### 2. Environment Setup

Create environment files:
```bash
# Copy example env files (you'll need to create these)
cp .env.example .env.dev
cp packages/core/.env.example packages/core/.env.dev
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `QDRANT_URL` & `QDRANT_API_KEY` - Qdrant vector database
- `DB_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service (optional)
- AWS credentials for deployment

### 3. Database Setup

```bash
# Start local PostgreSQL with Docker
pnpm --filter @airframe/core db:nuke:up

# Run database migrations
pnpm --filter @airframe/core db:migrate:local
```

### 4. Development

```bash
# Start development environment (Next.js app + SST)
pnpm dev

# Start development for specific stage
pnpm dev:adam

# Type checking across all packages
pnpm typecheck

# Run tests
pnpm --filter @airframe/core test
```

### 5. Chrome Extension Development (Optional)

```bash
# Build and watch extension
pnpm dev:ext

# Load dist_chrome/ folder as unpacked extension in Chrome
```

## 📋 Common Development Commands

### Database Operations
```bash
# Reset database and run migrations
pnpm --filter @airframe/core db:nuke:up:migrate

# Generate new migration
pnpm --filter @airframe/core db:generate:migrations

# Run migrations on production
pnpm db:migrate:prod
```

### Deployment
```bash
# Deploy to production
pnpm deploy:prod

# Deploy to staging
pnpm deploy:adam
```

### Package-specific Commands
```bash
# Run specific package commands
pnpm --filter @airframe/core [command]
pnpm --filter web [command]
pnpm --filter ext [command]
```

## 🏗 Development Workflow

### Adding New Features

1. **Domain Logic**: Add core functionality to `packages/core/src/domain/`
2. **Database Changes**: 
   - Update schemas in `packages/core/src/sql/schema/`
   - Generate migrations: `pnpm --filter @airframe/core db:generate:migrations`
3. **API Endpoints**: Add tRPC routers in `packages/core-web/src/trpc/routers/`
4. **UI Components**: Create reusable components in `packages/core-web/src/components/`
5. **Pages**: Add Next.js pages/routes in `packages/web/src/app/`

### Code Organization

- **Database**: Drizzle schemas in `packages/core/src/sql/schema/`
- **tRPC API**: Routers in `packages/core-web/src/trpc/routers/`
- **UI Components**: Shared components in `packages/core-web/src/components/`
- **Domain Logic**: Business logic in `packages/core/src/domain/`
- **Background Jobs**: Lambda functions in `packages/functions/src/`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run core package tests with SST shell
pnpm --filter @airframe/core test

# Run tests in specific package
pnpm --filter [package-name] test
```

## 🚀 Deployment

### Staging
```bash
pnpm deploy:adam
```

### Production
```bash
pnpm deploy:prod
```

The application uses SST v3 for infrastructure as code, automatically provisioning:
- AWS Lambda functions
- S3 buckets for document storage  
- SQS queues for background processing
- CloudFront distribution
- Route 53 DNS (if configured)

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Reset local database
   pnpm --filter @airframe/core db:nuke:up:migrate
   ```

2. **TypeScript Errors**
   ```bash
   # Run type checking
   pnpm typecheck
   ```

3. **Build Issues**
   ```bash
   # Clean and reinstall dependencies
   rm -rf node_modules packages/*/node_modules
   pnpm install
   ```

4. **SST Deployment Issues**
   - Ensure AWS credentials are configured
   - Check stage name matches your environment
   - Verify all required environment variables are set

## 📚 Documentation

- **CLAUDE.md**: Detailed project documentation for AI development assistance
- **API Documentation**: tRPC routes are self-documenting via TypeScript
- **Component Documentation**: Storybook setup (if configured)

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Biome for formatting and linting
3. Write tests for new functionality
4. Update database schemas through migrations
5. Follow the existing package structure

## 🔐 Security

- Authentication handled by Better-auth
- Organization-based multi-tenancy
- API routes protected by authentication middleware
- Environment variables for sensitive configuration
- AWS IAM roles for least-privilege access

# How to start as a new developer:

1. Install [pnpm](https://pnpm.io/installation)
2. Install [Docker](https://www.docker.com/) or [orbstack](https://orbstack.dev/pricing)
3. To create a database run:
`
cd packages/core
pnpm run db:up && pnpm run db:migrate:local
`
4. Configure your aws account. You will need Access Key to manager resources on AWS. This project requires AWS account to run it locally.
5. Create .env.dev file in top level folder:
`
DATABASE_URL=postgres://postgres:postgres@localhost:5937/airframe
BETTER_AUTH_URL=https://localhost:3000
BETTER_AUTH_SECRET=ABB8qCQN85Gw6WsfDzadjlS7jjGgpY6yRBCb1WXLURjwpoi1mtwLZbNNu0KBg3SgRfuce5GOJeSweuDAeQ
`
6. Create new script in packages.json
`
"dev:[your_name]": "dotenvx run -f .env.dev -- sst dev --stage [your_name]",
`
7. You should be able to run `pnpm i && pnpm dev` to run the project.


# Useful resources:
- Kanban with tasks: https://github.com/users/adamszeptycki/projects/2/views/1

---

Built with ❤️ using [SST](https://sst.dev), [Next.js](https://nextjs.org), and [pnpm workspaces](https://pnpm.io)
