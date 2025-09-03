import Thumbnail from "../models/thumbnail.js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";
import util from "util";
import { fileURLToPath } from "url";

const pipelineAsync = util.promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createThumbnail = async (request, reply) => {
  try {
    const parts = request.parts(); // <-- FIX: use parts() for iteration
    let fields = {};
    let filename;

    for await (const part of parts) {
      if (part.file) {
        filename = `${Date.now()}-${part.filename}`;
        const uploadDir = path.join(__dirname, "..", "uploads", "thumbnail");

        // Ensure folder exists
        await fs.promises.mkdir(uploadDir, { recursive: true });

        const saveTo = path.join(uploadDir, filename);
        await pipelineAsync(part.file, fs.createWriteStream(saveTo));
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (!filename) {
      return reply.code(400).send({ message: "No file uploaded" });
    }

    const thumbnail = new Thumbnail({
      user: request.user.id,
      videoName: fields.videoName,
      version: fields.version,
      image: `/uploads/thumbnail/${filename}`,
      paid: fields.paid === "true",
    });

    await thumbnail.save();

    reply.code(201).send(thumbnail);
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: "Error creating thumbnail", error });
  }
};

export const getThumbnails = async (request, reply) => {
  try {
    const thumbnails = await Thumbnail.find({ user: request.user.id });
    return reply.code(200).send(thumbnails);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Error fetching thumbnails" });
  }
};

export const getThumbnail = async (request, reply) => {
  try {
    const thumbnail = await Thumbnail.findOne({
      _id: request.params.id,
      user: request.user.id,
    });

    if (!thumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }

    return reply.code(200).send(thumbnail);
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Error fetching thumbnail" });
  }
};

export const updateThumbnail = async (request, reply) => {
  try {
    const updatedData = request.body;
    const updatedThumbnail = await Thumbnail.findOneAndUpdate(
      { _id: request.params.id, user: request.user.id },
      updatedData,
      { new: true }
    );
    if (!updatedThumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }
    return reply.code(200).send(updatedThumbnail);
  } catch (error) {
    return reply.code(500).send({ message: "Error updating thumbnail" });
  }
};

export const deleteThumbnail = async (request, reply) => {
  try {
    const deletedThumbnail = await Thumbnail.findOneAndDelete({
      _id: request.params.id,
      user: request.user.id,
    });

    if (!deletedThumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }

    const filepath = path.join(
      __dirname,
      "..",
      "uploads",
      "thumbnail",
      path.basename(deletedThumbnail.image)
    );

    try {
      await fs.promises.unlink(filepath);
    } catch (err) {
      console.error("File deletion error:", err);
    }

    return reply.code(200).send({ message: "Thumbnail deleted successfully" });
  } catch (error) {
    return reply.code(500).send({ message: "Error deleting thumbnail" });
  }
};

export const deleteAllThumbnails = async (request, reply) => {
  try {
    const thumbnails = await Thumbnail.find({ user: request.user.id });
    if (!thumbnails.length) {
      return reply.code(404).send({ message: "No thumbnails found" });
    }
    await Promise.all(
      thumbnails.map(async (thumb) => {
        const filepath = path.join(
          __dirname,
          "..",
          "uploads",
          "thumbnail",
          path.basename(thumb.image)
        );
        try {
          await fs.promises.unlink(filepath);
        } catch {}
      })
    );
    await Thumbnail.deleteMany({ user: request.user.id });
    return reply
      .code(200)
      .send({ message: "All thumbnails deleted successfully" });
  } catch (error) {
    return reply.code(500).send({ message: "Error deleting thumbnails" });
  }
};
