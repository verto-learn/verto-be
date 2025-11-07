import z from "zod";

export const profileUpdateSchema = z.object({
  new_email: z
    .string({ message: "New email is required" })
    .email({ message: "Invalid email format" })
    .toLowerCase()
    .trim(),
  new_full_name: z
    .string({ message: "New full name is required" })
    .min(3, { message: "Full name must be at least 3 characters" })
    .trim(),
});