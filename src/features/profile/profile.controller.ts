import { AuthRequest } from "../../middleware/verifyToken";
import { Response, NextFunction } from "express";
import { APIResponse } from "../../models/response";
import { updateProfileService } from "./profile.service";

export const updateProfile = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const user_id = req?.user?.user_id as string;
    const { new_email, new_full_name } = req.body;

    const updatedChange = await updateProfileService(
      user_id,
      new_email,
      new_full_name,
    );

    return res.status(200).json({
      message: "Profile updated successfully!",
      status: "success",
      data: updatedChange,
    });
  } catch (err) {
    next(err);
  }
};