import express from "express"
import cors from "cors";

import router from "./route/index.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", router);

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

export default app;
