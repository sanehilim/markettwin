import "server-only";

import { appConfig, hasApiHealthAdminToken } from "@/lib/config";

export function isAdminRequest(request: Request) {
  if (!hasApiHealthAdminToken()) return true;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const header = request.headers.get("x-admin-token")?.trim();
  const token = appConfig.apiHealthAdminToken.trim();

  return Boolean(token) && (bearer === token || header === token);
}

export function adminRequiredMessage() {
  return "API health is protected. Provide an admin token with the x-admin-token header.";
}
