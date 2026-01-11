import createFetchMock from "vitest-fetch-mock";
import { sql } from "drizzle-orm";
import { vi, afterEach } from "vitest";
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

const fetchMock = createFetchMock(vi);

fetchMock.enableMocks();
// this entire mock setus up unit tests to use PGLite - so we don't have to worry about migrations and cleaning database for tests
vi.mock("@starter/core/sql", async (importOriginal) => {
    const { ...rest } =
      await importOriginal<typeof import("@starter/core/sql")>()
    const { schema } = rest
    const { PGlite } = await vi.importActual<
      typeof import("@electric-sql/pglite")
    >("@electric-sql/pglite")
    const { drizzle } =
      await vi.importActual<typeof import("drizzle-orm/pglite")>(
        "drizzle-orm/pglite",
      )
  
    // use require to defeat dynamic require error
    // (https://github.com/drizzle-team/drizzle-orm/issues/2853#issuecomment-2668459509)
    const { createRequire } =
      await vi.importActual<typeof import("node:module")>("node:module")
    const require = createRequire(import.meta.url)
    
    const { pushSchema } =
      require("drizzle-kit/api") as typeof import("drizzle-kit/api")
      


    const client = new PGlite({
      extensions: {pg_trgm}
    })
    const db = drizzle(client, { schema })
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    // apply schema to db
    const { apply } = await pushSchema(schema, db as any)
    await apply()

  
    return { ...rest, getDb: () => db }
})

async function cleanupDatabase() {
    const { getDb } = await import("@starter/core/sql");
    const query = sql<string>`SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;
    const db = getDb();
    const tables = (await db.execute(query)) as {
        rows: { table_name: string }[];
    };
    for (const table of tables.rows) {
        const query = sql.raw(`TRUNCATE TABLE "${table.table_name}" CASCADE;`);
        await db.execute(query);
    }   
}

// after each test we clean up database
afterEach(async () => {
  await cleanupDatabase();
})

// mock getting secrets 

vi.mock("@starter/core/config/secret", async () => {
  return {
    getSecret: (key: string) => `test-${key}`
  }
})

vi.mock("@starter/core/config/resourceUrls", async () => {
  return {
    getResourceUrl: (key: string) => `url-test-${key}`
  }
})

vi.mock("@starter/core/aws/sqs/sendMessage", async () => {
  return {
    pushMessageToSQS: vi.fn().mockResolvedValue("test-message-id")
  }
})
