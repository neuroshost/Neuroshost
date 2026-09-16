import { NextRequest } from "next/server";

export function getPublicOrigin(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";

  const host =
    forwardedHost?.split(",")[0].trim() ||
    req.headers.get("host") ||
    "neuroshost.fr";

  const proto = forwardedProto.split(",")[0].trim();

  return `${proto}://${host}`;
}
