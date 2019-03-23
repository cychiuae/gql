import DataLoader from "dataloader";
import { PoolClient } from "pg";
import { knex } from "./db";
import { SelfUser } from "./types";

interface Options {
  userId: string;
  client: PoolClient;
}

interface Loaders {
  selfUserLoader: DataLoader<string, SelfUser>;
}

function makeOutput<T, K extends keyof T>(
  keyName: K,
  keys: T[K][],
  ts: T[]
): T[] {
  const dict: any = {};
  for (const t of ts) {
    dict[t[keyName]] = t;
  }
  const output = [];
  for (const key of keys) {
    if (dict[key]) {
      output.push(dict[key]);
    } else {
      output.push(null);
    }
  }
  return output;
}

async function loadSelfUsers(
  keys: string[],
  options: Options
): Promise<SelfUser[]> {
  const { client } = options;
  const { sql, bindings } = knex
    .select("username")
    .from("user")
    .whereIn("username", keys)
    .toSQL()
    .toNative();
  const { rows } = await client.query(sql, bindings);
  const output = makeOutput("username", keys, rows);
  return output;
}

export function makeLoaders(options: Options): Loaders {
  return {
    selfUserLoader: new DataLoader(keys => {
      return loadSelfUsers(keys, options);
    }),
  };
}
