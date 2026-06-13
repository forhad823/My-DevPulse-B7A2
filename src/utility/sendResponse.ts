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

  /*   // 2. Check if it's a PostgreSQL pg driver error containing 'detail'
  if (
    error &&
    typeof error === "object" &&
    "detail" in error &&
    typeof (error as { detail: unknown }).detail === "string"
  ) {
    detail = (error as { detail: string }).detail;
  } */

  res.status(statusCode).json({
    success: false,
    message: resolvedMessage,
    errors: error || resolvedMessage,
  });
};

/*   • With custom message:
    sendErrorResponse(400, "Invalid user details provided", error, res);          
  
  • Without custom message (defaults to the error's message):
    sendErrorResponse(500, undefined, error, res); */

/* 
res.status(201).json({
  success: true,
  message: "User registered successfully",
  data: result.rows[0],
});

Standard Success Response Structure

{
  "success": true,
  "message": "Operation description",
  "data": "Response data"
}
Standard Error Response Structure

{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
 */
