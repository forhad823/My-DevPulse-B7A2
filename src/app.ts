import express, {
  type Application,
  type Request,
  type Response,
} from "express";

// import { userRoute } from "./modules/user/user.route";
// import { profileRoute } from "./modules/profile/profile.route";
import logger from "./middleware/logger";
// import CookieParser from "cookie-parser";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";

const app: Application = express();

// app.use(CookieParser());
// -- default middlewares
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// -- custom middlewares
app.use(logger);

app.use(
  cors({
    origin: "http://localhost:3000/", // for sharing backend resource to frontend
  }),
);

// middleware request এর আগে use করতে হবে

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Express Server",
    Author: "Forhad Uddin",
  });
});

// making api below
/* 
app.use("/api/users", userRoute);
app.use("/api/profile", profileRoute);
*/
app.use("/api/auth", authRoute); 

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
