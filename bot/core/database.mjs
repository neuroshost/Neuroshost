import mysql from "mysql2/promise";
import { runtime } from "../config/runtime.mjs";
export const db = mysql.createPool({ ...runtime.database, waitForConnections: true, connectionLimit: 6 });
export async function query(sql, params = []) { return db.execute(sql, params); }
