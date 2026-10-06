import "server-only";
import { Pool, types } from "pg";

// numeric -> number, timestamptz -> ISO string, date -> "YYYY-MM-DD" string,
// so rows match the types in `@/lib/types` and serialize cleanly to the client.
types.setTypeParser(1700, (v) => parseFloat(v));
types.setTypeParser(1184, (v) => new Date(v).toISOString());
types.setTypeParser(1082, (v) => v);

const globalForPg = globalThis as unknown as { stocksPool?: Pool };

/** One pool per server process (cached across dev hot reloads). */
export const pool =
  globalForPg.stocksPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForPg.stocksPool = pool;

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

type TxQuery = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

/**
 * Runs `fn` inside a single transaction on one client (begin/commit/rollback).
 * Use for multi-statement writes that must all succeed or all fail together,
 * e.g. crediting a balance and inserting the matching transaction row.
 */
export async function withTransaction<T>(fn: (query: TxQuery) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const txQuery: TxQuery = async (text, params = []) => (await client.query(text, params)).rows;
    const result = await fn(txQuery);
    await client.query("commit");
    return result;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
