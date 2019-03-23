import { buildSchema } from "graphql";
import { ulid } from "ulid";
// @ts-ignore
import schemaString from "./schema.graphql";
import {
  ensureNoAccessToken,
  ensureUserId,
  writeAccessToken,
  readAccessTokenFromRequest,
} from "./express";
import { inTxn, knex } from "./db";
import { hashPassword, comparePassword } from "./password";
import { makeToken, extractUserId } from "./jwt";
import { makeLoaders } from "./dataloader";
import {
  SignupInput,
  LoginInput,
  Context,
  SelfUser,
  CreatePostInput,
  Post,
} from "./types";

export const schema = buildSchema(schemaString);

async function signup(args: SignupInput, context: Context): Promise<SelfUser> {
  const { username, password } = args;
  const { req, res } = context;
  ensureNoAccessToken(req, res);
  const userId = ulid();
  const token = await makeToken(userId);
  const selfUser = await inTxn(async client => {
    const hashed = await hashPassword(password);
    const { sql, bindings } = knex("user")
      .insert({
        id: userId,
        username,
        password: hashed,
      })
      .toSQL()
      .toNative();
    await client.query(sql, bindings);
    const { selfUserLoader } = makeLoaders({ userId, client });
    return selfUserLoader.load(userId);
  });
  writeAccessToken(res, token);
  return selfUser;
}

async function login(args: LoginInput, context: Context): Promise<SelfUser> {
  const { username, password } = args;
  const { req, res } = context;
  ensureNoAccessToken(req, res);
  const [selfUser, token] = await inTxn(async client => {
    const { sql, bindings } = knex
      .select("id", "password")
      .from("user")
      .where({
        username,
      })
      .toSQL()
      .toNative();
    const { rows } = await client.query(sql, bindings);
    if (rows.length <= 0) {
      throw new Error("invaid credentials");
    }
    const { password: hashed, id: userId } = rows[0];
    const token = await makeToken(userId);
    const result = await comparePassword(password, hashed);
    if (!result) {
      throw new Error("invaid credentials");
    }
    const { selfUserLoader } = makeLoaders({ userId, client });
    return Promise.all([selfUserLoader.load(userId), token]);
  });
  writeAccessToken(res, token);
  return selfUser;
}

async function getSelf(
  _args: never,
  context: Context
): Promise<SelfUser | null> {
  const { req } = context;
  const token = readAccessTokenFromRequest(req);
  if (token == null) {
    return null;
  }
  const userId = await extractUserId(token);
  const selfUser = await inTxn(async client => {
    const { selfUserLoader } = makeLoaders({ userId, client });
    return selfUserLoader.load(userId);
  });
  return selfUser;
}

async function createPost(
  args: CreatePostInput,
  context: Context
): Promise<Post> {
  const { content } = args;
  const { req } = context;
  const userId = await ensureUserId(req);
  const post = await inTxn(async client => {
    const postId = ulid();
    const { sql, bindings } = knex("post")
      .insert({
        id: postId,
        author_id: userId,
        content,
      })
      .toSQL()
      .toNative();
    await client.query(sql, bindings);
    const { postLoader } = makeLoaders({ userId, client });
    return postLoader.load(postId);
  });
  return post;
}

async function getMyPosts(_args: never, context: Context): Promise<Post[]> {
  const { req } = context;
  const userId = await ensureUserId(req);
  const posts = await inTxn(async client => {
    const { sql, bindings } = knex
      .select("id")
      .from("post")
      .where({
        author_id: userId,
      })
      .orderBy("id", "desc")
      .toSQL()
      .toNative();
    const { rows } = await client.query(sql, bindings);
    const ids = rows.map(row => row.id);
    const { postLoader } = makeLoaders({ userId, client });
    return postLoader.loadMany(ids);
  });
  return posts;
}

export const rootValue = {
  signup,
  login,
  getSelf,
  createPost,
  getMyPosts,
};
