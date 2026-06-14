import type { TIssue } from "../modules/issues/issues.interface";

export function validateAndProcessIssue(
  reqBody: TIssue | null | undefined,
): boolean | string {
  const errors: string[] = [];
  // Check if req.body is null or undefined
  if (reqBody === null || reqBody === undefined) {
    return "Request body is empty or null or undefined. A valid request body with title, description, and type fields is required.";
  }

  // Check if all 3 fields exist (not missing)
  const requiredFields: (keyof TIssue)[] = ["title", "description", "type"];
  const missingFields = requiredFields.filter((field) => !(field in reqBody));

  if (missingFields.length > 0) {
    errors.push(`Missing required field(s): ${missingFields.join(", ")}`);
  }

  // Validate title (must be string, provided, max 150 characters)
  if (typeof reqBody.title !== "string") {
    errors.push("Title must be a string value");
  } else {
    if (reqBody.title.trim().length === 0) {
      errors.push("Title must be provided and cannot be empty");
    }
    if (reqBody.title.length > 150) {
      errors.push(
        `Title exceeds maximum length of 150 characters (current: ${reqBody.title.length} characters)`,
      );
    }
  }

  // Validate description (must be string, provided, min 20 characters)
  if (typeof reqBody.description !== "string") {
    errors.push("Description must be a string value");
  } else {
    if (reqBody.description.trim().length === 0) {
      errors.push("Description must be provided and cannot be empty");
    }
    if (reqBody.description.length < 20) {
      errors.push(
        `Description must be at least 20 characters (current: ${reqBody.description.length} characters)`,
      );
    }
  }

  // Validate type (must be string, either 'bug' or 'feature_request')
  if (typeof reqBody.type !== "string") {
    errors.push("Type must be a string value");
  } else {
    if (reqBody.type !== "bug" && reqBody.type !== "feature_request") {
      errors.push(
        `Type must be either 'bug' or 'feature_request' (provided: '${reqBody.type}')`,
      );
    }
  }

  // Return error response if any validation failed
  if (errors.length > 0) {
    return errors.join("; ");
  }

  // All validations passed
  return true;
}
