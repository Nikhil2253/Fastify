import Fastify from "fastify";
import { configDotenv } from "dotenv";
import fastifyEnv from "@fastify/env";
import path from "path";
import { fileURLToPath } from "url";
import cors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import mongoPlugin from "./plugins/mongodb.js";
import jwtPlugin from "./plugins/jwt.js";
import auth from "./routes/auth.js";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import thumbnail from "./routes/thumbnail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
configDotenv();

const fastify = Fastify({
  logger: true,
});

// Core plugins
await fastify.register(cors);
await fastify.register(fastifySensible);
await fastify.register(fastifyMultipart);
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

// Custom plugins
fastify.register(mongoPlugin);
fastify.register(jwtPlugin);

// Application routes
fastify.register(auth, { prefix: "/api/auth" });
fastify.register(thumbnail, { prefix: "/api/thumbnail" });

// Env schema and config loader
const schema = {
  type: "object",
  required: ["PORT", "MONGODB_URI", "JWT_SECRET"],
  properties: {
    PORT: { type: "string", default: "5500" },
    MONGODB_URI: {
      type: "string",
      default: "mongodb://127.0.0.1:27017/fastify-learn",
    },
    JWT_SECRET: { type: "string", default: "hashirama-senju" },
  },
};

await fastify.register(fastifyEnv, {
  dotenv: true,
  schema,
});

// Health check route
fastify.get("/", async () => {
  return { hello: "world" };
});

// Database connection test route
fastify.get("/test-db", async (req, reply) => {
  try {
    const mongoose = fastify.mongoose;
    const connectionState = mongoose.connection.readyState;

    let status = "";
    switch (connectionState) {
      case 0:
        status = "disconnected";
        break;
      case 1:
        status = "connected";
        break;
      case 2:
        status = "connecting";
        break;
      case 3:
        status = "disconnecting";
        break;
      default:
        status = "unknown";
    }

    return { success: true, state: connectionState, status };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: "Failed to test database" });
  }
});

// Server bootstrap
const start = async () => {
  try {
    await fastify.listen({ port: fastify.config.PORT });
    fastify.log.info(
      `Server is running at http://localhost:${fastify.config.PORT}/`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
