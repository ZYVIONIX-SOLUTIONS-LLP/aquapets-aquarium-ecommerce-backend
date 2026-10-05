import app from "./app.js";
import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";


const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`
🚀 Aqua Pets Aquarium Backend is running!
📡 Port: ${config.port}
🌍 Mode: ${config.nodeEnv}
🔗 API Base: http://localhost:${config.port}/api
❤️ Health:   http://localhost:${config.port}/api/health
    `);
  });

  const handleExit = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => handleExit("SIGINT"));
  process.on("SIGTERM", () => handleExit("SIGTERM"));
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
