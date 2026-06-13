import type { Request, Response } from "express";
import { IssueService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import { userInfo } from "node:os";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utility/sendResponse";

const createIssue = async (req: Request, res: Response) => {
    try {
    const [id, role] = [req.userID, req.userRole];
    const result = await IssueService.createIssueIntoDB(req.body, id);
    sendSuccessResponse(res, 201, "Issue created successfully", result);
  } catch (error: unknown) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

export const issuesController = {
  createIssue,
};
