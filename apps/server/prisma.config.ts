import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Mismos ficheros que ConfigModule en app.module.ts: .env de la raíz o de apps/server.
config({ path: ['../../.env', '.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
