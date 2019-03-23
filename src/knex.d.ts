import { Sql } from "knex";

declare module "knex" {
  interface Sql {
    toNative: () => { sql: string; bindings: unknown[] };
  }
}
