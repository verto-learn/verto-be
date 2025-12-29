import prisma from "../../database/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../shared/generateToken";
import { Response } from "express";
import { checkUser } from "../../shared/checkUser";
import { setAuthCookie } from "../../shared/setAuthCookie";
import { clearAuthCookie } from "../../shared/clearAuthCookie";
import { APIError } from "../../middleware/errorHandler";


export const createUserService = async (
  full_name: string,
  email: string,
  password: string,
) => {
  const existingUser = await checkUser(email);

  if (existingUser) {
    throw new APIError("User email already exist", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.user.create({
    data: {
      full_name,
      email,
      password: hashedPassword,
    },
  });

  return result;
};

export const loginUserService = async (
  email: string,
  password: string,
  res: Response,
) => {
  const user = await checkUser(email);
  if (!user) {
    throw new APIError("Invalid Credentials!", 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new APIError("Invalid Credentials!");
  }

  const token = generateToken({ user_id: user.id, role: user.role });
  setAuthCookie(token, res);

  const { full_name, role } = user;
  const userWithCourses = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      selected_courses: {
        select: {
          course_id: true,
        },
      },
    },
  });

  return {
    full_name,
    email,
    role,
    selected_courses: userWithCourses?.selected_courses ?? [],
  };
};

export const getUserService = async (user_id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      selected_courses: {
        select: {
          course_id: true,
        },
      },
      total_score: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    throw new APIError("User not found", 404);
  }

  return {
    user,
  };
};

export const logoutUserService = async (res: Response) => {
  clearAuthCookie(res);
};

export const changePasswordService = async (
  user_id: string,
  old_password: string,
  new_password: string,
  confirm_new_password: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });

  const oldPasswordIsMatch = await bcrypt.compare(
    old_password,
    user?.password as string,
  );

  const newPasswordIsMatch =
    new_password.trim() === confirm_new_password.trim();

  if (!oldPasswordIsMatch) {
    throw new Error("Old password is do not match");
  }

  if (!newPasswordIsMatch) {
    throw new Error("New password is do not match");
  }

  const hashedNewPassword = await bcrypt.hash(new_password, 10);

  const changedPassword = await prisma.user.update({
    where: {
      id: user_id,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  return { message: "Password changed successfully" };
};


export const getAllUsersService = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      created_at: "desc", // Urutkan dari user paling baru daftar
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      total_score: true,
      created_at: true,
      // Kita hitung jumlah course dan quiz yang diikuti user (opsional, bagus untuk dashboard admin)
      _count: {
        select: {
          selected_courses: true,
          quiz_attempts: true,
          generated_course: true,
        },
      },
    },
  });

  return users;
};

// ... imports yang sudah ada

export const getUserStatsService = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  
  const [totalUsers, totalStudents, totalAdmins, newUsersToday, activeLearners] = await Promise.all([
    

    prisma.user.count(),


    prisma.user.count({
      where: { role: "user" },
    }),


    prisma.user.count({
      where: { role: "admin" },
    }),

    prisma.user.count({
      where: {
        created_at: {
          gte: startOfToday,
        },
      },
    }),

    prisma.user.count({
      where: {
        role: "user",
        selected_courses: {
          some: {}, 
        },
      },
    }),
  ]);

  return {
    total_users: totalUsers,
    total_students: totalStudents,
    total_admins: totalAdmins,
    new_users_today: newUsersToday,
    active_learners: activeLearners,
    active_ratio: totalStudents > 0 ? Math.round((activeLearners / totalStudents) * 100) : 0,
  };
};