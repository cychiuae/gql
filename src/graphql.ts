import { buildSchema } from "graphql";
// @ts-ignore
import schemaString from "./schema.graphql";

export const schema = buildSchema(schemaString);

export const rootValue = {
  hello: () => "Hello, World!",
};
