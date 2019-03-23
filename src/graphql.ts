import { buildSchema } from "graphql";
// @ts-ignore
import schemaString from "./schema.graphql";
import {
  ensureNoAccessToken,
  writeAccessToken,
  readAccessTokenFromRequest,
} from "./express";
import { inTxn } from "./db";
import { hashPassword, comparePassword } from "./password";
import { makeToken, extractUserId } from "./jwt";
import { makeLoaders } from "./dataloader";
import { SignupInput, LoginInput, Context, SelfUser } from "./types";

export const schema = buildSchema(schemaString);

async function signup(args: SignupInput, context: Context): Promise<SelfUser> {
  const { username, password } = args;
  const { req, res } = context;
  ensureNoAccessToken(req, res);
  const token = await makeToken(username);
  const selfUser = await inTxn(async client => {
    const stmt = `INSERT INTO "user" (username, password) VALUES ($1, $2)`;
    const hashed = await hashPassword(password);
    const values = [username, hashed];
    await client.query(stmt, values);
    const { selfUserLoader } = makeLoaders({ userId: username, client });
    return selfUserLoader.load(username);
  });
  writeAccessToken(res, token);
  return selfUser;
}

async function login(args: LoginInput, context: Context): Promise<SelfUser> {
  const { username, password } = args;
  const { req, res } = context;
  ensureNoAccessToken(req, res);
  const token = await makeToken(username);
  const selfUser = await inTxn(async client => {
    const stmt = `SELECT password from "user" where username = $1`;
    const values = [username];
    const { rows } = await client.query(stmt, values);
    if (rows.length <= 0) {
      throw new Error("invaid credentials");
    }
    const hashed = rows[0].password;
    const result = await comparePassword(password, hashed);
    if (!result) {
      throw new Error("invaid credentials");
    }
    const { selfUserLoader } = makeLoaders({ userId: username, client });
    return selfUserLoader.load(username);
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

export const rootValue = {
  signup,
  login,
  getSelf,
};
