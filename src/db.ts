import { Pool, PoolClient } from "pg";

const pool = new Pool();

export async function inTxn<T>(
  op: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ret = await op(client);
    await client.query("COMMIT");
    return ret;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
