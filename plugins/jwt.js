import fastifyPlugin from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";

const jwtPlugin = fastifyPlugin(async (fastify, opts) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
  });

  fastify.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.send(error);
    }
  });
});

export default jwtPlugin;
