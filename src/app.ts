import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config/env.js";

const app = express();

// Trust Nginx reverse proxy (Hostinger VPS)
app.set("trust proxy", 1);

// Performance and security middleware
app.use(compression());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Allowed frontend origins
const allowedOrigins = [
  config.clientUrl,
  process.env.ADMIN_URL,

  // Production customer website
  "https://aquapetsaquarium.com",
  "https://www.aquapetsaquarium.com",
  "http://aquapetsaquarium.com",
  "http://www.aquapetsaquarium.com",

  // Production admin panel
  "https://admin.aquapetsaquarium.com",
  "http://admin.aquapetsaquarium.com",

  // Local development
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.trim().replace(/\/$/, ""));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow mobile apps, curl, Postman, and server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow explicitly configured origins OR any aquapetsaquarium.com subdomain/protocol
    const isAquaDomain = origin.includes("aquapetsaquarium.com");
    const isLocalOrLan =
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("172.20.") ||
      origin.includes("192.168.");

    if (allowedOrigins.includes(origin) || isAquaDomain || isLocalOrLan) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },

  credentials: true,

  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// Apply CORS globally, including OPTIONS preflight requests
app.use(cors(corsOptions));

// Request logging
app.use(morgan("dev"));

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// Root API endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Aqua Pets Aquarium API Server",
    docs: "/api",
    health: "/api/health",
  });
});

// API routes
app.use("/api", routes);

// Global error handler (must remain last)
app.use(errorHandler);

export default app;
