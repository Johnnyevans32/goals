export interface AppConfig {
  api: {
    baseUrl: string;
  };
  app: {
    name: string;
    environment: "development" | "production" | "test";
  };
}

export const appConfig: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Goals & Actions",
    environment:
      (process.env.NODE_ENV as "development" | "production" | "test") ||
      "development",
  },
};

export const isDevelopment = () => appConfig.app.environment === "development";
