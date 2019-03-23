import express from "express";
import cookieParser from "cookie-parser";
import graphqlHTTP from "express-graphql";
import {
  errorHandler,
  asyncHandler,
  ensureNoAccessToken,
  writeAccessToken,
} from "./express";
import { inTxn } from "./db";
import { hashPassword, comparePassword } from "./password";
import { makeToken } from "./jwt";
import { schema, rootValue } from "./graphql";

const server = express();
server.use(express.json());
server.use(cookieParser());
server.use(
  "/graphql",
  graphqlHTTP(async (req, res, _graphqlParams) => ({
    schema,
    rootValue,
    context: {
      req,
      res,
    },
    graphiql: true,
  }))
);

server.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const {
      body: { username, password },
    } = req;
    ensureNoAccessToken(req, res);
    const token = await makeToken(username);
    await inTxn(async client => {
      const stmt = `INSERT INTO "user" (username, password) VALUES ($1, $2)`;
      const hashed = await hashPassword(password);
      const values = [username, hashed];
      await client.query(stmt, values);
    });
    writeAccessToken(res, token);
  })
);

server.post(
  "/login",
  asyncHandler(async (req, res) => {
    const {
      body: { username, password },
    } = req;
    ensureNoAccessToken(req, res);
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
    writeAccessToken(res, token);
  })
);

server.use(errorHandler);

server.listen(3000, "0.0.0.0", (err: Error) => {
  if (err) {
    throw err;
  }
});
