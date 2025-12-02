import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config";

const genAI = new GoogleGenerativeAI(`${config.geminiApiKey}`);

export const textGeminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});