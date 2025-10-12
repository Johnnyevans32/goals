import express from "express";
import cors from "cors";
import initializeDatabase from "./config/connection";
import { appConfig } from "./config/app";
import authRoutes from "./routes/auth";
import goalRoutes from "./routes/goals";
import actionRoutes from "./routes/actions";
import aiRoutes from "./routes/ai";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/goals", actionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/ai", aiRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    environment: appConfig.nodeEnv,
    version: "1.0.0",
  });
});

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(appConfig.port, () => {
      console.log(`Server is running on port ${appConfig.port}`);
      console.log(`Environment: ${appConfig.nodeEnv}`);
      console.log(`Health check: http://localhost:${appConfig.port}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
