import dotenv from "dotenv";

export const loadEnv = () => {
  const result = dotenv.config();
  if (result.error) {
    throw new Error("Failed to load environment variables");
  }
};

interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  geminiApiKey: string;
  youtubeApiBaseUrl: string;
  youtubeApiKey: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  youtubeApiBaseUrl: process.env.YOUTUBE_API_BASE_URL || "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
};

export default config;