import express from "express";
import cors from "cors";

import routes from "./route/index.js";
import errorHandler from "./middleware/error-handler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", routes);

app.use(errorHandler);

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

export default app;
