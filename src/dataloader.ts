import DataLoader from "dataloader";
import { PoolClient } from "pg";
import { knex } from "./db";
import { props } from "./promise";
import { SelfUser, Post } from "./types";

interface Options {
  userId: string;
  client: PoolClient;
}

type SelfUserLoader = DataLoader<string, SelfUser>;
type PostLoader = DataLoader<string, Post>;
type PostLikedLoader = DataLoader<string, boolean>;

interface Loaders {
  selfUserLoader: SelfUserLoader;
  postLoader: PostLoader;
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
  console.log("louis#loadSelfUsers", keys);
  const { client } = options;
  const { sql, bindings } = knex
    .select("id", "username", "name")
    .from("user")
    .whereIn("id", keys)
    .toSQL()
    .toNative();
  const { rows } = await client.query(sql, bindings);
  const output = makeOutput("id", keys, rows);
  return output;
}

async function loadPostLikeds(
  keys: string[],
  options: Options
): Promise<boolean[]> {
  console.log("louis#loadPostLikeds", keys);
  const { userId, client } = options;
  const { sql, bindings } = knex
    .select("post_id")
    .from("user_likes_post")
    .whereIn("post_id", keys)
    .where({
      user_id: userId,
    })
    .toSQL()
    .toNative();
  const { rows } = await client.query(sql, bindings);
  const output: ({ post_id: string } | null)[] = makeOutput(
    "post_id",
    keys,
    rows
  );
  return output.map(a => (a == null ? false : true));
}

async function loadPosts(
  keys: string[],
  options: Options,
  selfUserLoader: SelfUserLoader,
  postLikedLoader: PostLikedLoader
): Promise<Post[]> {
  console.log("louis#loadPosts", keys);
  const { client } = options;
  const { sql, bindings } = knex
    .select("id", "author_id", "content")
    .from("post")
    .whereIn("id", keys)
    .toSQL()
    .toNative();
  const { rows } = await client.query(sql, bindings);
  const postRows: {
    id: string;
    author_id: string;
    content: string;
  }[] = makeOutput("id", keys, rows);

  return Promise.all(
    postRows.map(postRow => {
      return props({
        id: postRow.id,
        content: postRow.content,
        author: () => {
          return selfUserLoader.load(postRow.author_id);
        },
        liked: () => {
          return postLikedLoader.load(postRow.id);
        },
      });
    })
  );
}

export function makeLoaders(options: Options): Loaders {
  const selfUserLoader: SelfUserLoader = new DataLoader(keys => {
    return loadSelfUsers(keys, options);
  });
  const postLikedLoader: PostLikedLoader = new DataLoader(keys => {
    return loadPostLikeds(keys, options);
  });
  const postLoader: PostLoader = new DataLoader(keys => {
    return loadPosts(keys, options, selfUserLoader, postLikedLoader);
  });
  return {
    selfUserLoader,
    postLoader,
  };
}
