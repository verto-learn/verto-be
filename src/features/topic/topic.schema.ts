import { z } from "zod";

export const createTopicSchema = z
  .object({
    name: z
      .string({ message: "Topic name is required" })
      .min(1, { message: "Topic name is required" })
      .trim(),
    description: z
      .string({ message: "Topic description is required" })
      .min(1, { message: "Topic description is required" }),
  })
  .strip()
  .describe("createTopicSchema");

export const deleteTopicSchema = z
  .object({
    topic_id: z
      .string({ message: "Topic Id is required" })
      .min(1, { message: "Topic Id is required" })
      .trim(),
  })
  .strip()
  .describe("deleteTopicSchema");