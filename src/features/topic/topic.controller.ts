import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middleware/verifyToken";
import {
  createTopicService,
  deleteTopicService,
  getAdminInfoService,
  getAllTopicsService,
} from "./topic.service";
import { APIResponse } from "../../models/response";
import { createTopicSchema, deleteTopicSchema } from "./topic.schema";

export const getAllTopics = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const topics = await getAllTopicsService();
    res.status(200).json({
      status: "success",
      message: "Topics fetched successfully",
      data: topics,
    });
  } catch (err) {
    next(err);
  }
};

export const createTopic = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { name, description } = createTopicSchema.parse(req.body);

    const topic = await createTopicService(name, description);

    return res.status(201).json({
      status: "success",
      message: "Topic created successfully",
      data: topic,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTopic = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  const { topic_id } = deleteTopicSchema.parse(req.params);
  try {
    const deletedTopic = await deleteTopicService(topic_id);
    return res.status(200).json({
      status: "success",
      message: "Topic deleted successfully",
      data: deletedTopic,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminInfo = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const result = await getAdminInfoService();
    return res.status(200).json({
      message: "Admin info success",
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};