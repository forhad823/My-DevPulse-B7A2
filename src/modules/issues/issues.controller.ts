import type { Request, Response } from "express";
import { IssueService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import { userInfo } from "node:os";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utility/sendResponse";
import { userService } from "../user/user.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const [id, role] = [req.userID, req.userRole];
    const result = await IssueService.createIssueIntoDB(req.body, id);
    sendSuccessResponse(res, 201, "Issue created successfully", result);
  } catch (error: unknown) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const issue = await IssueService.getSingleIssueFromDB(id as string);
    const userInfo = await userService.getUserInfoFromDB(issue.reporter_id);
    delete issue.reporter_id;
    // issue.reporter = userInfo;
    const formattedIssue = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: userInfo,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
    sendSuccessResponse(
      res,
      200,
      "Issue retrieved successfully",
      formattedIssue,
    );
  } catch (error: unknown) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

export const issuesController = {
  createIssue,
  getSingleIssue,
};
