import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connection_string,
});

export const initDB = async () => {
  try {
    await pool.query(``);
    console.log("Database connected Successfully!");
  } catch (error) {
    console.log(error);
  }
};
