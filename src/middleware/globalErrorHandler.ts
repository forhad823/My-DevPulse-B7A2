import type {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";

interface IAppError extends Error {
  statusCode?: number;
}

const globalErrorHandler: ErrorRequestHandler = (
  err: IAppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.stack,
  });
};

export default globalErrorHandler;
