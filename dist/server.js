
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method-URL-Time:", req.method, req.url, Date.now());
  const log = `
Method -> ${req.method}, Time -> ${Date.now()}, URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err.stack
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
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
app.use(globalErrorHandler_default);
var app_default = app;

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT
  // secret: process.env.JWT_SECRET,
  // refresh_secret: process.env.JWT_REFRESH_SECRET,
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(``);
    console.log("Database connected Successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map