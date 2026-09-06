import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  console.error('❌ TURSO_DATABASE_URL is not set. Prisma cannot connect.');
}

// Create the libSQL client (HTTP for Turso cloud, file:// for local dev)
const libsqlClient = createClient({
  url: tursoUrl!,
  authToken: tursoToken || undefined,
});

// Wrap with Prisma adapter
const adapter = new PrismaLibSQL(libsqlClient);

export const prisma = new PrismaClient({ adapter });
