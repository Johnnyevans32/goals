import { config } from "dotenv";

config();

interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
}

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwt: JWTConfig;
  openrouter: OpenRouterConfig;
}

const requiredEnvVars = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
  "JWT_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DATABASE_HOST || "",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "",
    password: process.env.DATABASE_PASSWORD || "",
    name: process.env.DATABASE_NAME || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai",
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  },
};

export default appConfig;
