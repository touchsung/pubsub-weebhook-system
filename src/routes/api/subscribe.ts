import { FastifyPluginAsync } from "fastify";
import { isLeft } from "fp-ts/Either";
import * as t from "io-ts";
import { IPubSubService } from "@/services/interfaces/IPubSubService";

const SubscribeBodySchema = t.type({
  url: t.string,
});

const subscribeRoutes: FastifyPluginAsync = async (fastify) => {
  const pubSubService =
    fastify.diContainer.resolve<IPubSubService>("pubSubService");

  fastify.post(
    "/subscribe",
    {
      schema: {
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const bodyValidation = SubscribeBodySchema.decode(request.body);

      if (isLeft(bodyValidation)) {
        return reply.code(400).send({
          status: "error",
          message: "Invalid request body",
        });
      }

      const result = await pubSubService.subscribe(bodyValidation.right);

      if (isLeft(result)) {
        fastify.log.error(result.left);
        return reply.code(500).send({
          status: "error",
          message: "Internal server error",
        });
      }

      return reply.send({
        status: "ok",
        data: {
          sub_id: result.right.sub_id,
          secret: result.right.secret,
        },
      });
    }
  );

  fastify.post(
    "/unsubscribe",
    {
      schema: {
        body: {
          type: "object",
          required: ["sub_id"],
          properties: {
            sub_id: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub_id } = request.body as { sub_id: number };
      const result = await pubSubService.unsubscribe(sub_id);

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

      return reply.send({ status: "ok" });
    }
  );
};

export default subscribeRoutes;
