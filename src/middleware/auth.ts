// import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { ROLES } from "../types";
import config from "../config";
import { pool } from "../db";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const auth = (...roles: ROLES[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // console.log("this is protected Route");
      // 1. Check if the token exists
      // 2. Verify the token
      // 3. Find the user into database
      // 4. If the user active or not?

      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!!",
        });
      }
      // encoded in auth.service.ts. now time to decode
      const decoded = jwt.verify(
        token as string,
        config.secret as string,
      ) as JwtPayload;

      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id],
      );
      console.log(userData);
      const user = userData.rows[0];

      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!",
        });
      }

      /*   if (!user?.is_active) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!",
        });
      }     */

      // console.log("Auth Role: ", user.role);

      // roles = ["admin","agent"]
      // user.role = "admin" | "user" | "agent"

      if (roles.length && !roles.includes(user.role)) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized!,This role have no access!",
        });
      }
      req.userName = decoded.name;
      req.userID = decoded.id; // req: {user : {}}
      req.userRole = decoded.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
