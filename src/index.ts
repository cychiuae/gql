import { IncomingMessage } from "http";
import fastify, { FastifyRequest } from "fastify";
import { inTxn } from "./db";
import { hashPassword, comparePassword } from "./password";
import { makeToken } from "./jwt";
import { writeAccessToken, readAccessToken } from "./cookie";

const server = fastify({
  logger: true,
});

function readAccessTokenFromRequest(
  request: FastifyRequest<IncomingMessage>
): string | null {
  const { cookie } = request.headers;
  const accessToken = readAccessToken(cookie);
  return accessToken;
}

function ensureNoAccessToken(request: FastifyRequest<IncomingMessage>) {
  const accessToken = readAccessTokenFromRequest(request);
  if (accessToken != null) {
    throw new Error("unexpected access token");
  }
}

server.get("/", async (_request, _reply) => {
  return "Hello, World";
});

server.post("/signup", async (request, reply) => {
  const {
    body: { username, password },
  } = request;
  ensureNoAccessToken(request);
  const token = await makeToken(username);
  await inTxn(async client => {
    const stmt = `INSERT INTO "user" (username, password) VALUES ($1, $2)`;
    const hashed = await hashPassword(password);
    const values = [username, hashed];
    await client.query(stmt, values);
  });
  reply.header("Set-Cookie", writeAccessToken(token));
  return "";
});

server.post("/login", async (request, reply) => {
  const {
    body: { username, password },
  } = request;
  ensureNoAccessToken(request);
  const token = await makeToken(username);
  const hashed = await inTxn(async client => {
    const stmt = `SELECT password from "user" where username = $1`;
    const values = [username];
    const { rows } = await client.query(stmt, values);
    if (rows.length <= 0) {
      throw new Error("invaid credentials");
    }
    const hashed = rows[0].password;
    return hashed;
  });
  const result = await comparePassword(password, hashed);
  if (!result) {
    throw new Error("invaid credentials");
  }
  reply.header("Set-Cookie", writeAccessToken(token));
  return "";
});

server.listen(3000, "0.0.0.0", (err, address) => {
  if (err) {
    throw err;
  }
  console.log("listen at " + address);
});
