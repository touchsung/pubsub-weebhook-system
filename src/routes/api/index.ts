import { FastifyPluginAsync } from "fastify";
import subscribeRoutes from "./subscribe";
import dataRoutes from "./data";

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(subscribeRoutes, { prefix: "/api" });
  await fastify.register(dataRoutes, { prefix: "/api" });
};

export default apiRoutes;
