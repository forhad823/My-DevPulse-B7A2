
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";
import CookieParser from "cookie-parser";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.stack
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role VARCHAR(20) DEFAULT 'contributor'
      CHECK (role IN ('contributor', 'maintainer')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`);
    await pool.query(`
  CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    
    title VARCHAR(150) NOT NULL,
    
    description TEXT NOT NULL
    CHECK (LENGTH(description) >= 20),
    
    type VARCHAR(20) NOT NULL
    CHECK (type IN ('bug', 'feature_request')),

    status VARCHAR(20) DEFAULT 'open'
      CHECK (status IN ('open', 'in_progress', 'resolved')),
      
      reporter_id INT NOT NULL,
      
      created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    )
    `);
    console.log("Database connected Successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var isDuplicateUser = async (email) => {
  const result = await pool.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows.length > 0;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials !");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials !");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const accessToken = jwt.sign(jwtpayload, config_default.secret, {
    expiresIn: "1d"
  });
  const refreshToken = jwt.sign(jwtpayload, config_default.refresh_secret, {
    expiresIn: "20d"
    // refresh token's expire period long
  });
  return { accessToken, refreshToken, user };
};
var authService = {
  isDuplicateUser,
  loginUserIntoDB
};

// src/modules/user/user.service.ts
import bcrypt2 from "bcryptjs";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt2.hash(password, 12);
  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4,'contributor'))
        RETURNING *     
        `,
    [name, email, hashPassword, role]
  );
  if (result.rows.length !== 0) delete result.rows[0].password;
  return result;
};
var getUserInfoFromDB = async (id) => {
  const result = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );
  return result.rows[0];
};
var userService = {
  createUserIntoDB,
  getUserInfoFromDB
};

// src/utility/sendResponse.ts
var sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
var sendErrorResponse = (res, statusCode, message, error) => {
  let resolvedMessage = message || "An unexpected error occurred";
  let detail = void 0;
  if (error instanceof Error) {
    if (!message) {
      resolvedMessage = error.message;
    }
  }
  res.status(statusCode).json({
    success: false,
    message: resolvedMessage,
    errors: error || resolvedMessage
  });
};

// src/utility/roles.ts
var ROLES = ["contributor", "maintainer"];

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res) => {
  const { role, email } = req.body;
  try {
    if (!ROLES.includes(role)) {
      return sendErrorResponse(
        res,
        400,
        "Invalid input",
        "Your role input is invalid, role should be must 'contributor' or 'maintainer'"
      );
    }
    if (await authService.isDuplicateUser(email)) {
      return sendErrorResponse(
        res,
        400,
        "Duplicate Email Entered",
        "This email is already Registered, Please log in"
      );
    }
    const result = await userService.createUserIntoDB(req.body);
    sendSuccessResponse(
      res,
      201,
      "User registered successfully",
      result.rows[0]
    );
  } catch (error) {
    sendErrorResponse(res, 500, void 0, error);
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { accessToken, user, refreshToken } = result;
    if (user) delete user.password;
    res.cookie("refreshToken", refreshToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    sendSuccessResponse(res, 201, "Login successful", {
      token: accessToken,
      user
    });
  } catch (error) {
    sendErrorResponse(
      res,
      400,
      "Invalid Credentials",
      "Entered wrong email or password or both. Please enter the credentials Correctly"
    );
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/login", authController.loginUser);
router.post("/signup", authController.registerUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, userId) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
       INSERT INTO issues (
        title,
        description,
        type,
        reporter_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
          `,
    [title, description, type, userId]
  );
  return result.rows[0];
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1
        `,
    [id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (sort, type, status) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;
  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortOrder = sort === "oldest" ? "ASC" : "DESC";
  const issuesResult = await pool.query(
    `
      SELECT *
      FROM issues
      ${whereClause}
      ORDER BY created_at ${sortOrder}
    `,
    values
  );
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(", ");
  const usersResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id IN (${placeholders})
    `,
    reporterIds
  );
  const usersMap = new Map(usersResult.rows.map((user) => [user.id, user]));
  return issues.map((issue) => {
    const {
      id,
      title,
      description,
      type: type2,
      status: status2,
      reporter_id,
      created_at,
      updated_at
    } = issue;
    return {
      id,
      title,
      description,
      type: type2,
      status: status2,
      reporter: usersMap.get(reporter_id) ?? null,
      created_at,
      updated_at
    };
  });
};
var updateIssueIntoDB = async (id, payload) => {
  const updates = [];
  const values = [];
  let paramIndex = 1;
  if (payload.title !== void 0) {
    updates.push(`title = $${paramIndex++}`);
    values.push(payload.title);
  }
  if (payload.description !== void 0) {
    updates.push(`description = $${paramIndex++}`);
    values.push(payload.description);
  }
  if (payload.type !== void 0) {
    updates.push(`type = $${paramIndex++}`);
    values.push(payload.type);
  }
  updates.push(`updated_at = NOW()`);
  values.push(id);
  const result = await pool.query(
    `
      UPDATE issues
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `,
    values
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1  
      `,
    [id]
  );
  return result;
};
var issueService = {
  createIssueIntoDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  getAllIssuesFromDB,
  deleteIssueFromDB
};

// src/utility/validate_issue.ts
function validateAndProcessIssue(reqBody) {
  const errors = [];
  if (reqBody === null || reqBody === void 0) {
    return "Request body is empty or null or undefined. A valid request body with title, description, and type fields is required.";
  }
  const requiredFields = ["title", "description", "type"];
  const missingFields = requiredFields.filter((field) => !(field in reqBody));
  if (missingFields.length > 0) {
    errors.push(`Missing required field(s): ${missingFields.join(", ")}`);
  }
  if (typeof reqBody.title !== "string") {
    errors.push("Title must be a string value");
  } else {
    if (reqBody.title.trim().length === 0) {
      errors.push("Title must be provided and cannot be empty");
    }
    if (reqBody.title.length > 150) {
      errors.push(
        `Title exceeds maximum length of 150 characters (current: ${reqBody.title.length} characters)`
      );
    }
  }
  if (typeof reqBody.description !== "string") {
    errors.push("Description must be a string value");
  } else {
    if (reqBody.description.trim().length === 0) {
      errors.push("Description must be provided and cannot be empty");
    }
    if (reqBody.description.length < 20) {
      errors.push(
        `Description must be at least 20 characters (current: ${reqBody.description.length} characters)`
      );
    }
  }
  if (typeof reqBody.type !== "string") {
    errors.push("Type must be a string value");
  } else {
    if (reqBody.type !== "bug" && reqBody.type !== "feature_request") {
      errors.push(
        `Type must be either 'bug' or 'feature_request' (provided: '${reqBody.type}')`
      );
    }
  }
  if (errors.length > 0) {
    return errors.join("; ");
  }
  return true;
}

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const invalidInput = validateAndProcessIssue(req.body);
    if (invalidInput !== true) {
      return sendErrorResponse(res, 400, "Bad Request", invalidInput);
    }
    const [id, role] = [req.userID, req.userRole];
    const result = await issueService.createIssueIntoDB(req.body, id);
    sendSuccessResponse(res, 201, "Issue created successfully", result);
  } catch (error) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const issues = await issueService.getAllIssuesFromDB(
      sort,
      type,
      status
    );
    sendSuccessResponse(res, 200, "Issues retrieved successfully", issues);
  } catch (error) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await issueService.getSingleIssueFromDB(id);
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
      updated_at: issue.updated_at
    };
    sendSuccessResponse(
      res,
      200,
      "Issue retrieved successfully",
      formattedIssue
    );
  } catch (error) {
    sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};
var updateIssue = async (req, res) => {
  const issueid = req.params.id;
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      sendErrorResponse(
        res,
        400,
        "Invalid input",
        "Request body is empty or null or undefined. A valid request body with title, description, or type fields is required."
      );
    }
    const updatedIssue = await issueService.updateIssueIntoDB(
      issueid,
      req.body
    );
    sendSuccessResponse(res, 200, "Issue updated successfully", updatedIssue);
  } catch (error) {
    sendErrorResponse(res, 500, void 0, error);
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      return sendErrorResponse(
        res,
        404,
        "Issue not found",
        "Possible you have passed the incorrect issue id parameter in the url or api or may be the issue doesn't exist on issues table, or already deleted"
      );
    }
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendErrorResponse(res, 500, void 0, error);
  }
};
var issuesController = {
  createIssue,
  getSingleIssue,
  updateIssue,
  getAllIssues,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendErrorResponse(
          res,
          401,
          "Unauthorized access!!",
          "Either no token found or token expired, Please login"
        );
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret
      );
      if (roles.length && !roles.includes(decoded?.role)) {
        return sendErrorResponse(
          res,
          401,
          "Unauthorized!",
          "This role have no access!"
        );
      }
      req.userID = decoded.id;
      req.userName = decoded.name;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/middleware/updateAuth.ts
var updateAuth = (...roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userID;
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [userId]
      );
      const user = userData.rows[0];
      if (user.role === "contributor") {
        const issueid = req.params.id;
        const { reporter_id, status } = await issueService.getSingleIssueFromDB(
          issueid
        );
        if (!(String(reporter_id) === String(user.id) && status === "open")) {
          return sendErrorResponse(
            res,
            403,
            "Forbidden !!",
            "You are contributor. You can only update your own issue and only when the issue's status is 'open'"
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var updateAuth_default = updateAuth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssue
);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  updateAuth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.updateIssue
);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
var app = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000/"
    // for sharing backend resource to frontend
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse Express Server",
    Author: "Forhad Uddin"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map