// import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { ROLES } from "../types";
import config from "../config";
import { pool } from "../db";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { sendErrorResponse } from "../utility/sendResponse";
import { IssueService } from "../modules/issues/issues.service";

const auth = (...roles: ROLES[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendErrorResponse(
          res,
          401,
          "Unauthorized access!!",
          "Either no token found or token expired, Please login",
        );
      }
      // encoded in auth.service.ts. now time to decode
      const decoded = jwt.verify(
        token as string,
        config.secret as string,
      ) as JwtPayload;

      if (roles.length && !roles.includes(decoded?.role)) {
        return sendErrorResponse(
          res,
          401,
          "Unauthorized!",
          "This role have no access!",
        );
      }
      req.userID = decoded.id; // req: {user : {}}
      req.userName = decoded.name;
      req.userRole = decoded.role;

      // for checking updating eligibility of contributor
      if (decoded.role === "contributor") {
        const issueid = req.params.id;
        const { reporter_id, status } = await IssueService.getSingleIssueFromDB(
          issueid as string,
        );
        if (
          !(String(reporter_id) === String(decoded.id) && status === "open")
        ) {
          return sendErrorResponse(
            res,
            403,
            "Forbidden !!",
            "You are contributor. You can only update your own issue and only when the issue's status is 'open'",
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
