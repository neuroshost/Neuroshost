import fs from "node:fs";
import path from "node:path";

export type RuntimeConfig = {
  database: { host:string; port:number; user:string; password:string; database:string };
  appSecret: string;
};

const dir = path.join(process.cwd(), ".runtime");
const file = path.join(dir, "config.json");

export function isInstalled(){ return fs.existsSync(file); }
export function getRuntimeConfig(): RuntimeConfig {
  if (!isInstalled()) throw new Error("NOT_INSTALLED");
  return JSON.parse(fs.readFileSync(file,"utf8"));
}
export function saveRuntimeConfig(config: RuntimeConfig){
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(file, JSON.stringify(config,null,2), { mode: 0o600 });
}
