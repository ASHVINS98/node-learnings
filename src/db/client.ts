import { Pool } from 'pg';
import  { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';


const connectionString = process.env.DATABASE_URL;


if (!connectionString) {
	throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

const pool = new Pool({ connectionString, max: 10 });

export const db = drizzle(pool, { schema });

export async function closeDb() {
	await pool.end();
}