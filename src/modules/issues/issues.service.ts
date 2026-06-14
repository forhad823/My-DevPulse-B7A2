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

export const IssueService = {
  createIssueIntoDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
};
