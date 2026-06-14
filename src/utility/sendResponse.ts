import type { Response } from "express";

// type TResponse<T> = {
//   // success: boolean;
//   // message: string;
//   data?: T;
//   // error?: unknown;
// };

// export const sendSuccessResponse = <T>(
//   statusCode: number,
//   message: string,
//   data: TResponse<T>,
//   res: Response,
// ): void => {
//   res.status(statusCode).json({
//     success: true,
//     message: message,
//     data: data,
//   });
// };

export const sendSuccessResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string | undefined,
  error: unknown,
): void => {
  let resolvedMessage = message || "An unexpected error occurred";
  let detail: string | undefined = undefined;

  if (error instanceof Error) {
    if (!message) {
      resolvedMessage = error.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message: resolvedMessage,
    errors: error || resolvedMessage,
  });
};