// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import compression from "compression";
// import routes from "./routes/index.js";
// import { errorHandler } from "./middleware/errorHandler.js";
// import { config } from "./config/env.js";

// const app = express();

// // Trust reverse proxy (Essential for Nginx on Hostinger VPS)
// app.set("trust proxy", 1);

// // Performance and utility middleware
// app.use(compression());
// app.use(helmet({ crossOriginResourcePolicy: false }));

// const allowedOrigins = [
//   config.clientUrl,
//   process.env.ADMIN_URL,
//   "https://aquapetsaquarium.com",
//   "https://www.aquapetsaquarium.com",
//   "https://admin.aquapetsaquarium.com",
//   "http://localhost:3000",
//   "http://127.0.0.1:3000",
//   "http://localhost:3001",
//   "http://127.0.0.1:3001",
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow non-browser requests (mobile apps, server-to-server, curl)
//       if (!origin) return callback(null, true);

//       const isAllowed =
//         allowedOrigins.includes(origin) ||
//         process.env.NODE_ENV !== "production" ||
//         origin.includes("localhost") ||
//         origin.includes("127.0.0.1") ||
//         origin.includes("aquapetsaquarium.com");

//       if (isAllowed) {
//         return callback(null, true);
//       }
//       return callback(new Error(`CORS blocked for origin: ${origin}`), false);
//     },
//     credentials: true,
//   })
// );
// app.use(morgan("dev"));
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // API Endpoints
// app.get("/", (req, res) => {
//   res.json({
//     message: "Aqua Pets Aquarium API Server",
//     docs: "/api",
//     health: "/api/health",
//   });
// });

// app.use("/api", routes);

// // Global Error Handler
// app.use(errorHandler);

// export default app;











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

  // Production admin panel
  "https://admin.aquapetsaquarium.com",

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
    // Allow mobile apps, curl and server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow only explicitly configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);

    // Reject without throwing a server error
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

  // Let cors reflect the browser's requested headers
  // This supports Authorization and custom frontend headers

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
