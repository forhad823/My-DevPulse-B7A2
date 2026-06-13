import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userID?: JwtPayload;
      userName?: JwtPayload;
      userRole?: JwtPayload;
    }
  }
}
