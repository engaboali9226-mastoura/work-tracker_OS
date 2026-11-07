import type {IncomingMessage, ServerResponse} from "./route-access-http-server.js";
import {
  authorizeAdminActionR271,
  type AdminActionR271,
  type AdminAuthorityR271,
} from "./noor-admin-policy-r271.js";

/**
 * An intentionally injectable, server-only boundary. No handler can create
 * accounts until a trusted authority resolver and audit-backed executor are
 * explicitly wired by the runtime. No credentials are accepted in this API.
 */
export interface AdminHttpDependenciesR271 {
  readonly expectedOrigin: string;
  readonly resolveAuthority: (sessionId: string) => Promise<AdminAuthorityR271 | null>;
  readonly listAccounts: () => Promise<readonly Readonly<{
    id: string;
    email: string;
    enabled: boolean;
  }>[]>;
}
export const NOOR_ADMIN_ACCOUNTS_PATH_R271 = "/api/noor/admin/accounts";

function respond(response: ServerResponse, status: number, body?: unknown): void {
  const data = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(Buffer.byteLength(data)),
    "X-Content-Type-Options": "nosniff",
  });
  response.end(data);
}

function hasExactOrigin(request: IncomingMessage, expected: string): boolean {
  let count = 0;
  for (let i = 0; i < request.rawHeaders.length; i += 2) {
    if (request.rawHeaders[i]?.toLowerCase() === "origin") {
      count++;
      if (request.rawHeaders[i + 1] !== expected) return false;
    }
  }
  return count === 1 && request.headers.origin === expected;
}

export async function handleAdminAccountsR271(
  request: IncomingMessage,
  response: ServerResponse,
  sessionId: string | null,
  dependencies: AdminHttpDependenciesR271,
): Promise<void> {
  if (request.method !== "POST") {
    respond(response, 405);
    return;
  }
  if (!hasExactOrigin(request, dependencies.expectedOrigin)) {
    respond(response, 403);
    return;
  }
  // This endpoint accepts no body, avoiding ambiguous command parsing.
  if (request.headers["transfer-encoding"] !== undefined ||
      (request.headers["content-length"] !== undefined &&
       request.headers["content-length"] !== "0")) {
    respond(response, 400);
    return;
  }
  if (!sessionId) {
    respond(response, 401);
    return;
  }
  try {
    const authority = await dependencies.resolveAuthority(sessionId);
    const action: AdminActionR271 = "accounts:list";
    if (!authorizeAdminActionR271(authority, action)) {
      respond(response, 403);
      return;
    }
    const accounts = await dependencies.listAccounts();
    respond(response, 200, {accounts});
  } catch {
    // Never fall back to public access when the authority store is unavailable.
    respond(response, 503);
  }
}
