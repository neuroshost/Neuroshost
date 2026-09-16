import crypto from "node:crypto";
import { runtime } from "../config/runtime.mjs";
export function decrypt(value) {
  if (!value?.startsWith("enc:v1:")) return value || "";
  const [, , ivB, tagB, dataB] = value.split(":");
  const key = crypto.createHash("sha256").update(runtime.appSecret).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
}
