import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing');
}

// Prepare PostgreSQL connection client
const client = postgres(process.env.DATABASE_URL);

// Initialize Drizzle ORM
export const db = drizzle(client);
