import Fastify from "fastify";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

// Simple in-memory store for subscriber secrets (for testing)
// In production, you'd query the database or have a proper secret management system
const subscriberSecrets = new Map<number, string>();

const createWebhookReceiver = async () => {
  const fastify = Fastify({ logger: true });

  // Create database connection for looking up subscriber secrets
  const createDbConnection = async () => {
    try {
      return await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "dbuser",
        password: process.env.DB_PASSWORD || "dbpassword",
        database: process.env.DB_NAME || "pubsub_webhook",
        timezone: "+00:00",
      });
    } catch (error) {
      console.warn("Could not connect to database for secret lookup:", error);
      return null;
    }
  };

  // Helper function to get subscriber secret by URL
  const getSubscriberSecretByUrl = async (
    url: string
  ): Promise<string | null> => {
    const db = await createDbConnection();
    if (!db) return null;

    try {
      const [rows] = await db.execute<any[]>(
        "SELECT secret FROM subscriber WHERE url = ?",
        [url]
      );
      await db.end();

      if (rows.length > 0) {
        return rows[0].secret;
      }
      return null;
    } catch (error) {
      console.warn("Error querying subscriber secret:", error);
      await db?.end();
      return null;
    }
  };

  // Helper function to get all subscriber secrets
  const getAllSubscriberSecrets = async (): Promise<string[]> => {
    const db = await createDbConnection();
    if (!db) return [];

    try {
      const [rows] = await db.execute<any[]>("SELECT secret FROM subscriber");
      await db.end();
      return rows.map((row) => row.secret);
    } catch (error) {
      console.warn("Error querying all subscriber secrets:", error);
      await db?.end();
      return [];
    }
  };

  fastify.post("/receive", async (request, reply) => {
    try {
      const { token } = request.body as { token: string };

      console.log("Webhook received!");

      // Try to get secret from the webhook URL (this receiver's URL)
      const receiverUrl = `http://localhost:${
        process.env.WEBHOOK_RECEIVER_PORT || 8000
      }/receive`;
      let secret = await getSubscriberSecretByUrl(receiverUrl);

      if (secret) {
        console.log("Found secret for this webhook URL in database");
        try {
          const verified = jwt.verify(token, secret);
          console.log("Token verified successfully with database secret!");
          console.log("Verified payload:", verified);
          console.log("Timestamp:", new Date().toISOString());
          console.log("---");

          return reply.send({
            status: "received",
            timestamp: new Date().toISOString(),
            payload: verified,
            verification: "database_secret",
          });
        } catch (verifyError) {
          console.log("Database secret failed, trying other methods...");
        }
      }

      throw new Error("No valid secret found for token verification");
    } catch (error) {
      console.error("Webhook processing failed:", error);
      console.log("Debugging info:");
      console.log("Request headers:", request.headers);
      console.log("Request body keys:", Object.keys(request.body as object));
      console.log("---");

      return reply.code(400).send({
        status: "error",
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Health check endpoint
  fastify.get("/health", async () => ({
    status: "ok",
    service: "webhook-receiver",
    timestamp: new Date().toISOString(),
  }));

  // Endpoint to register a subscriber secret manually (for testing)
  fastify.post("/register-secret", async (request, reply) => {
    const { sub_id, secret } = request.body as {
      sub_id: number;
      secret: string;
    };
    subscriberSecrets.set(sub_id, secret);

    console.log(`Registered secret for subscriber ${sub_id}`);

    return reply.send({
      status: "registered",
      sub_id,
      message: "Secret registered for testing",
    });
  });

  // Test endpoint with custom secret
  fastify.post("/test-receive/:secret", async (request, reply) => {
    const { secret } = request.params as { secret: string };
    const { token } = request.body as { token: string };

    try {
      const verified = jwt.verify(token, secret);
      console.log(`Test verification successful with secret: ${secret}`);
      console.log("Payload:", verified);

      return reply.send({
        status: "verified",
        secret: secret,
        payload: verified,
      });
    } catch (error) {
      console.error(`Test verification failed with secret: ${secret}`);
      return reply.code(400).send({
        status: "verification_failed",
        secret: secret,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Debug endpoint to show all subscriber secrets
  fastify.get("/debug/secrets", async (request, reply) => {
    try {
      const secrets = await getAllSubscriberSecrets();
      return reply.send({
        status: "ok",
        subscriber_count: secrets.length,
        secrets: secrets.map((secret, index) => ({
          index: index + 1,
          secret: secret.substring(0, 10) + "...", // Only show first 10 chars for security
        })),
      });
    } catch (error) {
      return reply.code(500).send({
        status: "error",
        message: "Failed to fetch secrets",
      });
    }
  });

  return fastify;
};

const startReceiver = async () => {
  try {
    const receiver = await createWebhookReceiver();
    const port = Number(process.env.WEBHOOK_RECEIVER_PORT) || 8000;

    await receiver.listen({ port, host: "0.0.0.0" });
    console.log(`Webhook receiver running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Test endpoint: http://localhost:${port}/test-receive/:secret`);
    console.log(`Debug secrets: http://localhost:${port}/debug/secrets`);
  } catch (err) {
    console.error("Failed to start webhook receiver:", err);
    process.exit(1);
  }
};

if (require.main === module) {
  startReceiver();
}

export { createWebhookReceiver };
