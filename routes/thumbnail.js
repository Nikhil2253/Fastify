import {
  createThumbnail,
  getThumbnails,
  getThumbnail,
  updateThumbnail,
  deleteThumbnail,
  deleteAllThumbnails,
} from "../controllers/thumbnailController.js";

const routes = async (fastify, opts) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post("/", createThumbnail);
  fastify.get("/", getThumbnails);
  fastify.delete("/", deleteAllThumbnails);
  fastify.get("/:id", getThumbnail);
  fastify.put("/:id", updateThumbnail);
  fastify.delete("/:id", deleteThumbnail);
};

export default routes;
