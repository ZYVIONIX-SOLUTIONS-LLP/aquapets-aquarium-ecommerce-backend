import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config/env.js";

const app = express();

// Performance and utility middleware
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: [
      config.clientUrl,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Aqua Pets Aquarium API Server",
    docs: "/api",
    health: "/api/health",
  });
});

app.use("/api", routes);

// Global Error Handler
app.use(errorHandler);

export default app;
