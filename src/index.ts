import express from "express";
import cookieParser from "cookie-parser";
import graphqlHTTP from "express-graphql";
import { errorHandler } from "./express";
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

server.use(errorHandler);

server.listen(3000, "0.0.0.0", (err: Error) => {
  if (err) {
    throw err;
  }
});
