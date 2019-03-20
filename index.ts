import fastify from "fastify";

const server = fastify({
  logger: true,
});

server.get("/", async (_request, _reply) => {
  return "Hello, World";
});

server.listen(3000, "0.0.0.0", (err, address) => {
  if (err) {
    throw err;
  }
  console.log("listen at " + address);
});
