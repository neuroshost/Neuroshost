import fs from "node:fs";
import path from "node:path";
export const runtime = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".runtime", "config.json"), "utf8"));
