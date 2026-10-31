import express from "express";
import cors from "cors";

import routes from "./common/route/index.js";
import errorHandler from "./middleware/error-handler.js";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
