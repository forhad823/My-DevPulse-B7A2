import { pool } from "../../db";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const isDuplicateUser = async (email: string): Promise<boolean> => {
  const result = await pool.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [email],
  );
  return result.rows.length > 0;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;
  // 1. check if the user exists -> Done
  // 2. compare the password -> Done
  // 3. Generate Token ->

  // 1. Check if the user exists
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials !");
  }

  // 2. Compare the password
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials !");
  }

  //3. Generate Token
  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(jwtpayload, config.refresh_secret as string, {
    expiresIn: "20d", // refresh token's expire period long
  });

  return { accessToken, refreshToken, user };
};

// const generateRefreshToken = async (token: string) => {
//   // 1. Check if the token exists
//   // 2. Verify the token
//   // 3. Find the user into database
//   // 4. If the user active or not?

//   if (!token) {
//     throw new Error("Unauthorized !!");
//   }

//   // verify
//   const decoded = jwt.verify(
//     token as string,
//     config.refresh_secret as string,
//   ) as JwtPayload;

//   // finding user
//   const userData = await pool.query(
//     `
//         SELECT * FROM users WHERE email=$1
//         `,
//     [decoded.email],
//   );

//   const user = userData.rows[0];
//   if (userData.rows.length === 0) {
//     throw new Error("User not found !!");
//   }

//   // active or not?
//   if (!user?.is_active) {
//     throw new Error("Forbidden !!");
//   }

//   // generate access Token
//   const jwtpayload = {
//     id: user.id,
//     name: user.name,
//     role: user.role,
//   };

//   const accessToken = jwt.sign(jwtpayload, config.secret as string, {
//     expiresIn: "1d",
//   });

//   return { accessToken };
// };

export const authService = {
  isDuplicateUser,
  loginUserIntoDB,
  //   generateRefreshToken,
};
