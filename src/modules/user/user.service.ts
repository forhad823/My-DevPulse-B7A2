import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "../auth/auth.interface";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  // encrypting sensitive data in DB (salt round 12 )
  const hashPassword = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4,'contributor'))
        RETURNING *     
        `,
    [name, email, hashPassword, role],
  );

  if (result.rows.length !== 0) delete result.rows[0].password;
  return result;
};

const getUserInfoFromDB = async (id: string) => {
  const result = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );

  return result.rows[0];
};

export const userService = {
  createUserIntoDB,
  getUserInfoFromDB,
};
