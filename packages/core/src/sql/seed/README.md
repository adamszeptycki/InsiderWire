# Database Seeding

This directory contains scripts for seeding the database with sample data for development and testing.

## Available Scripts

### Comprehensive Data Seeding (Recommended)

The `seedData.ts` script creates large-scale realistic test data across all major tables using Faker.js:

- **Organizations**: 12 organizations with realistic company information
- **Users**: 150+ users with complete profiles
- **Memberships**: Users assigned to organizations with various roles
- **Prospects**: 200+ prospects with company affiliations
- **Calls**: 300+ call records with realistic transcripts and metadata
- **Score Cards**: Score cards for 80% of calls with AI suggestions

#### Usage

```bash
# Run the comprehensive seed script
pnpm --filter /core seed:data
```

#### Features

- **Large-scale data**: 100+ records per table for performance testing
- **Always fresh**: Clears ALL existing data before seeding
- **Realistic data**: Uses Faker.js to generate authentic-looking test data
- **Safety first**: Prevents running in production environments
- **Relationship integrity**: Maintains proper foreign key relationships
- **Only for local dev**: Requires `.env.dev` environment configuration

#### Data Created

1. **Organizations**: 12 organizations with:
   - Company names and slugs
   - Industry verticals and sub-verticals
   - Domain names and tag lines
   - `isPlaceholder: true` (always)

2. **Users**: 150 users with:
   - Realistic names and emails
   - Profile images (33% have avatars)
   - Phone numbers (33% have phones)
   - Premium status (20% premium users)
   - Email verification status

3. **Members**: User-organization relationships with:
   - 5-20 members per organization
   - Varied roles (owner, admin, member, viewer)
   - Historical creation dates

4. **Prospects**: 200+ prospects with:
   - Full names
   - Company affiliations (50% have companies)
   - Organization and owner assignments

5. **Call Records**: 300+ calls with:
   - Multi-paragraph transcripts
   - Structured message arrays (agent/customer conversations)
   - Feedback types (positive, negative, neutral)
   - Call types (inbound, outbound)
   - Realistic durations (2-60 minutes)
   - Multiple tags per call
   - Compliance violation tracking
   - Prospect associations

6. **Score Cards**: Score cards for 80% of calls with:
   - Scores (1-10 scale)
   - AI-generated improvement suggestions

#### Safety Features

- Environment check prevents production execution
- Clear warning about data deletion
- Only runs with local development environment variables

---

### Call Data Seeding (Legacy)

The `seedCallsRecordsData.ts` script creates realistic sample data for the call management system:

- **Prospects**: 8 sample prospects with English names and company information
- **Calls**: 15 sample calls with realistic transcripts, feedback, and duration
- **Score Cards**: Score cards for 80% of calls with AI suggestions

#### Usage

```bash
# Run the seed script
pnpm --filter /core seed:calls-records-data
```

#### Features

- **Safe to run multiple times**: Checks for existing data to avoid duplicates
- **Auto-creates dependencies**: Creates test organization and user if they don't exist
- **Realistic data**: Uses English language transcripts and realistic business scenarios
- **No external dependencies**: Uses only existing project modules

#### Data Created

1. **Organization**: "Test Organization" (if none exists)
2. **User**: "Test User" with email "test@example.com" (if none exists)
3. **Prospects**: 8 prospects with English names and company information
4. **Calls**: 15 calls with:
   - Random transcripts in English
   - Random feedback (positive, negative, neutral)
   - Random duration (2-15 minutes)
   - Random prospect assignment
   - Random call types (inbound, outbound)
   - Random tags (1-3 per call)
5. **Score Cards**: Score cards for 80% of calls with:
   - Random scores (1-10)
   - AI suggestions for improvement

#### Sample Data Examples

**Prospects:**
- Anna Kowalska - TechCorp Ltd.
- Michael Novak - Innovations Inc.
- Catherine Wisniewska - Digital Solutions
- Peter Zielinski - FutureTech
- Magdalene Krawczyk - Smart Business
- Thomas Lewandowski - Progressive Systems
- Agnes Dabrowska - NextGen Technologies
- Martin Kaminski - Innovation Hub

**Call Transcripts:**
- "Good morning, I'm calling regarding our CRM system offer. Do you have a moment to talk?"
- "Hi, I would like to present our solutions for companies in the technology sector. Is this a good time?"
- "Hello, I'm calling from TechSolutions. Have you heard about our new products?"
- And more...

**AI Suggestions:**
- "The client seems interested but needs more information about specific benefits. Suggest a case study from a similar industry."
- "The conversation went very well. The client asked detailed questions. Send a detailed offer within 24 hours."
- "The client was skeptical about the costs. Focus on ROI and long-term benefits in the next conversation."
- And more...

**Call Tags:**
- missed-call, left-voicemail, call-back-requested
- connected, not-interested, do-not-call
- appointment-set, call-dropped, wrong-number
- And more...

## Requirements

- Database must be running and migrated
- Environment variables must be configured (`.env.dev` file)
- No additional packages required

## Troubleshooting

If you encounter issues:

1. Ensure database is running: `pnpm --filter /core db:up`
2. Run migrations: `pnpm --filter /core db:migrate:local`
3. Check environment variables in `.env.dev`
4. Check console output for specific error messages
