import type { JwtPayload } from "jsonwebtoken";
import type { TIssue } from "./issues.interface";
import { pool } from "../../db";

const createIssueIntoDB = async (
  payload: TIssue,
  userId: JwtPayload | undefined,
) => {
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
    [title, description, type, userId],
  );
  return result.rows[0];
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1
        `,
    [id],
  );
  return result.rows[0];
};

const getAllIssuesFromDB = async (
  sort?: string,
  type?: string,
  status?: string,
) => {
  // building dynamic WHERE clause based on optional query params
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(type);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  // Join conditions with AND, or empty string if no filters
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // ascending and descending order. descending default
  const sortOrder = sort === "oldest" ? "ASC" : "DESC";

  const issuesResult = await pool.query(
    `
      SELECT *
      FROM issues
      ${whereClause}
      ORDER BY created_at ${sortOrder}
    `,
    values,
  );

  const issues = issuesResult.rows;

  // If no issues found, return empty array early
  if (issues.length === 0) {
    return [];
  }

  //Collect all unique reporter IDs from the issues using Set
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const placeholders = reporterIds
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  const usersResult = await pool.query(
    `
      SELECT id, name, role
      FROM users
      WHERE id IN (${placeholders})
    `,
    reporterIds,
  );

  // building a Map for O(1) lookups
  const usersMap = new Map(usersResult.rows.map((user) => [user.id, user]));
  return issues.map((issue) => {
    const {
      id,
      title,
      description,
      type,
      status,
      reporter_id,
      created_at,
      updated_at,
    } = issue;
    return {
      id,
      title,
      description,
      type,
      status,
      reporter: usersMap.get(reporter_id) ?? null,
      created_at,
      updated_at,
    };
  });
};

const updateIssueIntoDB = async (id: string, payload: Partial<TIssue>) => {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  // if user updates only single field among title, description, role

  if (payload.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(payload.title);
  }

  if (payload.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(payload.description);
  }

  if (payload.type !== undefined) {
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
    values,
  );

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  getAllIssuesFromDB,
};
