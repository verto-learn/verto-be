import prisma from "../../database/database";
import { APIError } from "../../middleware/errorHandler";
import { format } from "date-fns";

export const getAllTopicsService = async () => {
  return await prisma.topic.findMany({
    orderBy: { name: "asc" },
  });
};

export const createTopicService = async (name: string, description: string) => {
  const existing = await prisma.topic.findUnique({ where: { name } });
  if (existing) {
    throw new APIError("Topic already exists", 400);
  }

  return await prisma.topic.create({
    data: {
      name,
      description,
    },
  });
};

export const deleteTopicService = async (topic_id: string) => {
  return await prisma.topic.delete({
    where: {
      id: topic_id,
    },
  });
};

export const getAdminInfoService = async () => {
  const users = await prisma.user.findMany({
    orderBy: { created_at: "asc" },
    select: { created_at: true },
  });

  const groupedUsers: Record<string, number> = {};
  users.forEach((u) => {
    const dateKey = format(u.created_at, "yyyy-MM-dd");
    groupedUsers[dateKey] = (groupedUsers[dateKey] || 0) + 1;
  });

  const usersFormatted = Object.entries(groupedUsers).map(([date, count]) => ({
    date,
    count,
  }));

  const selectedCourses = await prisma.selectedCourse.findMany({
    orderBy: { created_at: "asc" },
    select: {
      created_at: true,
      user: { select: { full_name: true } },
      course: { select: { title: true } },
    },
  });

  return {
    users: usersFormatted,
    selectedCourses,
  };
};