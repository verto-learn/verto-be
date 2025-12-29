import prisma from "../../database/database";


export const getLeaderboardService = async () => {
  const leaderboard = await prisma.user.findMany({
    where: {
      role: "user",
    },
    orderBy: {
      total_score: "desc",
    },
    take: 50,
    select: {
      id: true,
      full_name: true,
      email: true,
      total_score: true,
      created_at: true, 
    },
  });

  return leaderboard;
};