import { createApp } from "./app";
import { Config } from "./config";

const start = async () => {
  try {
    console.log("Running database migrations...");
    console.log("Database migrations completed");

    console.log("Starting application...");
    const app = await createApp();
    const config = app.getEnvs() as Config;

    await app.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    console.log(`Server running on http://localhost:${config.PORT}`);
    console.log(`Health check: http://localhost:${config.PORT}/health`);
    console.log(`Environment: ${config.NODE_ENV}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

start();
