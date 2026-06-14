import { Router } from "express";
import { USER_ROLE } from "../../types";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import updateAuth from "../../middleware/updateAuth";

const router = Router();
//3) create issue
router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssue,
);

//4) get all issue
router.get("/", issuesController.getAllIssues);

//5) get single issue
router.get("/:id", issuesController.getSingleIssue);

//6) update issue
router.patch(
  "/:id",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  updateAuth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.updateIssue,
);

//7) delete issue
router.delete("/:id", auth(USER_ROLE.maintainer), issuesController.deleteIssue);

export const issuesRoute = router;
