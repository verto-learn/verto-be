import dotenv from "dotenv";

export const loadEnv = () => {
  const result = dotenv.config();
  if (result.error) {
    throw new Error("Failed to load environment variables");
  }
};

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  geminiApiKey: string;
  redisPort: number;
  redisHost: string;
  redisUsername: string;
  redisPassword: string;
  redisDb: number;
  youtubeApiBaseUrl: string;
  youtubeApiKey: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisHost: process.env.REDIS_HOST || "localhost",
  redisUsername: process.env.REDIS_USERNAME || "default",
  redisPassword: process.env.REDIS_PASSWORD || "",
  redisDb: Number(process.env.REDIS_DB) || 0,
  youtubeApiBaseUrl: process.env.YOUTUBE_API_BASE_URL || "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
};

export default config;
