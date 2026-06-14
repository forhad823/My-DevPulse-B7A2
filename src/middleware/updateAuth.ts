import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ROLES } from "../types";
import { sendErrorResponse } from "../utility/sendResponse";
import { issueService } from "../modules/issues/issues.service";
import { pool } from "../db";

const updateAuth = (...roles: ROLES[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userID;
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [userId],
      );
      const user = userData.rows[0];

      // for checking updating eligibility of contributor
      if (user.role === "contributor") {
        const issueid = req.params.id;
        const { reporter_id, status } = await issueService.getSingleIssueFromDB(
          issueid as string,
        );
        if (!(String(reporter_id) === String(user.id) && status === "open")) {
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

export default updateAuth;
