import { Router } from "express";
import { USER_ROLE } from "../../types";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();
//3) create issue
router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssue,
);

//4) get all issue

//5) get single issue
router.get("/:id", issuesController.getSingleIssue);

export const issuesRoute = router;
