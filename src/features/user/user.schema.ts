import { z } from "zod";

export const createUserSchema = z
  .object({
    full_name: z
      .string({ error: "Full name is required" })
      .min(3, { message: "Full name must be at least 3 characters" })
      .trim(),
    email: z
      .string({ error: "Email is required" })
      .email({ message: "Invalid email format" })
      .toLowerCase()
      .trim(),
    password: z
      .string({ error: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .strip() 
  .describe("createUserSchema");

export const loginUserSchema = z
  .object({
    email: z
      .string({ error: "Email is required" })
      .email({ message: "Invalid email format" })
      .toLowerCase()
      .trim(),
    password: z
      .string({ error: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .strip() 
  .describe("loginUserSchema");

export const changePasswordSchema = z
  .object({
    old_password: z
      .string({ error: "Old Password is required" })
      .min(6, "Old Password must be at least 6 characters"),
    new_password: z
      .string({ error: "New Password is required" })
      .min(6, "New password must be at least 6 characters"),
    confirm_new_password: z
      .string({ error: "Confirm New Password is required" })
      .min(6, "Confirm new password must be at least 6 characters"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    path: ["confirm_new_password"],
    message: "Password do not match",
  });