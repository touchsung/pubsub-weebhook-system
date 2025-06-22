import { FastifyPluginAsync } from "fastify";
import { isLeft } from "fp-ts/Either";
import { IPubSubService } from "@/services/interfaces/IPubSubService";

const dataRoutes: FastifyPluginAsync = async (fastify) => {
  const pubSubService =
    fastify.diContainer.resolve<IPubSubService>("pubSubService");

  fastify.post(
    "/provide_data",
    {
      schema: {
        body: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { message } = request.body as { message: string };
      const result = await pubSubService.publishData({ message });

      if (isLeft(result)) {
        fastify.log.error(result.left);
        return reply.code(500).send({
          status: "error",
          message: "Internal server error",
        });
      }

      return reply.send({ status: "ok" });
    }
  );

  fastify.post(
    "/ask",
    {
      schema: {
        body: {
          type: "object",
          required: ["tx_id"],
          properties: {
            tx_id: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const { tx_id } = request.body as { tx_id: number };
      const result = await pubSubService.requestDataAndPublish(tx_id);

      if (isLeft(result)) {
        const error = result.left;
        if (error.message.includes("not found")) {
          return reply.code(404).send({
            status: "error",
            message: error.message,
          });
        }

        fastify.log.error(error);
        return reply.code(500).send({
          status: "error",
          message: "Internal server error",
        });
      }

      return reply.send({
        status: "ok",
        data: {
          message: result.right.message,
        },
      });
    }
  );
};

export default dataRoutes;
