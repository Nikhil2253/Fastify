import fastifyPlugin from "fastify-plugin";
import mongoose from "mongoose";

const mongoPlugin=fastifyPlugin(async(fastify,options)=>{
    try{
      await mongoose.connect(process.env.MONGODB_URI);
      fastify.decorate("mongoose", mongoose);
      fastify.log.info("MONGODB connected !");
    } catch(err){
        fastify.log.error(err);
        process.exit(1);
    }
})

export default mongoPlugin;
