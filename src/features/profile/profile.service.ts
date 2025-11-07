import prisma from "../../database/database";

export const updateProfileService = async (
  user_id: string,
  new_email: string,
  new_full_name: string,
) => {
  const existingEmail = await prisma.user.findUnique({
    where: {
      email: new_email,
      NOT: {
        id: user_id,
      },
    },
  });

  if (existingEmail) {
    throw new Error("Email is existing");
  }

  const updatedProfile = await prisma.user.update({
    where: {
      id: user_id,
    },
    data: {
      email: new_email,
      full_name: new_full_name,
    },
    select: {
      id: true,
      email: true,
      full_name: true,
    },
  });

  return updatedProfile;
};