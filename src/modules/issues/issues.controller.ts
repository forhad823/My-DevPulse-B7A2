import type { Request, Response } from "express";
import { issueService } from "./issues.service";
import type { JwtPayload } from "jsonwebtoken";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utility/sendResponse";
import { userService } from "../user/user.service";
import { validateAndProcessIssue } from "../../utility/validate_issue";

const createIssue = async (req: Request, res: Response) => {
  console.log(req.body);
  try {
    // checking is request body contains all required properties of issue
    const invalidInput = validateAndProcessIssue(req.body);
    if (invalidInput !== true) {
      return sendErrorResponse(res, 400, "Bad Request", invalidInput);
    }

    const [id, role] = [req.userID, req.userRole];
    const result = await issueService.createIssueIntoDB(req.body, id);
    sendSuccessResponse(res, 201, "Issue created successfully", result);
  } catch (error: unknown) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;

    const issues = await issueService.getAllIssuesFromDB(
      sort as string | undefined, 
      type as string | undefined, 
      status as string | undefined, 
    );

    sendSuccessResponse(res, 200, "Issues retrieved successfully", issues);
  } catch (error: unknown) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const issue = await issueService.getSingleIssueFromDB(id as string);
    const userInfo = await userService.getUserInfoFromDB(issue.reporter_id);
    delete issue.reporter_id;

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

const updateIssue = async (req: Request, res: Response) => {
  const issueid = req.params.id;
  try {
    // const [userid, userRole] = [req.userID, req.userRole];

    if (!req.body || Object.keys(req.body).length === 0) {
      sendErrorResponse(
        res,
        400,
        "Invalid input",
        "Request body is empty or null or undefined. A valid request body with title, description, or type fields is required.",
      );
    }
    const updatedIssue = await issueService.updateIssueIntoDB(
      issueid as string,
      req.body,
    );
    sendSuccessResponse(res, 200, "Issue updated successfully", updatedIssue);
  } catch (error: unknown) {
    sendErrorResponse(res, 500, undefined, error);
  }
};
export const issuesController = {
  createIssue,
  getSingleIssue,
  updateIssue,
  getAllIssues,
};
