import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { userService } from "../user/user.service";
// import type { IDatabaseError } from "../../types";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utility/sendResponse";
import { ROLES } from "../../utility/roles";

const registerUser = async (req: Request, res: Response) => {
  console.log("req.body", req.body);
  const { role, email } = req.body;
  try {
    if (!ROLES.includes(role)) {
      return sendErrorResponse(
        res,
        400,
        "Invalid input",
        "Your role input is invalid, role should be must 'contributor' or 'maintainer'",
      );
    }

    if (await authService.isDuplicateUser(email)) {
      return sendErrorResponse(
        res,
        400,
        "Duplicate Email Entered",
        "This email is already Registered, Please log in",
      );
    }

    const result = await userService.createUserIntoDB(req.body);

    sendSuccessResponse(
      res,
      201,
      "User registered successfully",
      result.rows[0],
    );
  } catch (error: unknown) {
    sendErrorResponse(res, 500, undefined, error);
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);

    const { accessToken, user, refreshToken } = result;
    if (user) delete user.password;

    res.cookie("refreshToken", refreshToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    });

    sendSuccessResponse(res, 201, "Login successful", {
      token: accessToken,
      user: user,
    });
  } catch (error: unknown) {
    sendErrorResponse(
      res,
      400,
      "Invalid Credentials",
      "Entered wrong email or password or both. Please enter the credentials Correctly",
    );
  }
};

export const authController = {
  registerUser,
  loginUser,
};
