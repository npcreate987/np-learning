import { createHmac } from "crypto";

/** Dev-only auth helpers. Never enable DEV_AUTH in production. */
export function isDevAuthEnabled(): boolean {
  return process.env.DEV_AUTH === "true";
}

export function devSecret(): string {
  return process.env.DEV_AUTH_SECRET ?? "np-dev-secret-change-me";
}

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

/** Signs a minimal HS256 JWT compatible with the JwtStrategy (aud=authenticated). */
export function signDevJwt(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    iat: now,
    exp: now + 7 * 24 * 3600,
    aud: "authenticated",
    ...payload,
  };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
  const sig = createHmac("sha256", devSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}
