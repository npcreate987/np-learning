import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { createPublicKey, type JsonWebKey } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { devSecret, isDevAuthEnabled } from "./dev-token";
import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string; display_name?: string };
}

interface Jwk {
  kid?: string;
  [key: string]: unknown;
}

// Cache the project's JWKS for 10 minutes to avoid fetching on every request.
let jwksCache: Jwk[] | null = null;
let jwksFetchedAt = 0;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function loadJwks(jwksUri: string, force = false): Promise<Jwk[]> {
  const now = Date.now();
  if (!force && jwksCache && now - jwksFetchedAt < JWKS_TTL_MS) {
    return jwksCache;
  }
  const res = await fetch(jwksUri);
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS (${res.status})`);
  }
  const data = (await res.json()) as { keys?: Jwk[] };
  jwksCache = data.keys ?? [];
  jwksFetchedAt = now;
  return jwksCache;
}

/** Returns a PEM public key for the given kid, refreshing the cache on miss. */
async function getPublicKeyPem(kid: string | undefined, jwksUri: string): Promise<string> {
  let keys = await loadJwks(jwksUri);
  let jwk = keys.find((k) => k.kid === kid);
  if (!jwk) {
    keys = await loadJwks(jwksUri, true);
    jwk = keys.find((k) => k.kid === kid);
  }
  if (!jwk) {
    throw new Error("No matching JWKS key for token");
  }
  const keyObject = createPublicKey({
    key: jwk as unknown as JsonWebKey,
    format: "jwk",
  });
  return keyObject.export({ format: "pem", type: "spki" }).toString();
}

function decodeJwtHeader(token: string): { alg?: string; kid?: string } {
  const part = token.split(".")[0];
  if (!part) return {};
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const devAuth = isDevAuthEnabled();
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    if (!devAuth && !supabaseUrl) {
      throw new Error("SUPABASE_URL is not set");
    }
    const jwksUri = supabaseUrl
      ? `${supabaseUrl}/auth/v1/.well-known/jwks.json`
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: "authenticated",
      // Only enforce issuer when verifying real Supabase tokens.
      ...(supabaseUrl ? { issuer: `${supabaseUrl}/auth/v1` } : {}),
      // Supabase signs new tokens with ES256 (asymmetric, via JWKS); legacy
      // and dev tokens use HS256 with a shared secret.
      algorithms: ["ES256", "RS256", "HS256"],
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: string,
        done: (err: Error | null, secretOrKey?: string) => void,
      ) => {
        let header: { alg?: string; kid?: string };
        try {
          header = decodeJwtHeader(rawJwtToken);
        } catch {
          done(new Error("Malformed token header"));
          return;
        }

        if (header.alg === "HS256") {
          const secret =
            process.env.SUPABASE_JWT_SECRET ?? (devAuth ? devSecret() : undefined);
          if (!secret) {
            done(new Error("No HS256 secret configured for this token"));
            return;
          }
          done(null, secret);
          return;
        }

        if (!jwksUri) {
          done(new Error("JWKS is not configured (set SUPABASE_URL)"));
          return;
        }
        getPublicKeyPem(header.kid, jwksUri)
          .then((pem) => done(null, pem))
          .catch((err) => done(err as Error));
      },
    });
  }

  /**
   * Runs after the signature is verified. We upsert a local Profile so the
   * rest of the app can rely on a foreign-key-able user row.
   */
  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid token");
    }

    const email = payload.email ?? `${payload.sub}@users.noreply.local`;
    const displayName =
      payload.user_metadata?.display_name ??
      payload.user_metadata?.full_name ??
      payload.user_metadata?.name ??
      null;

    const profile = await this.prisma.profile.upsert({
      where: { id: payload.sub },
      update: { email },
      create: {
        id: payload.sub,
        email,
        displayName,
        role: "STUDENT",
      },
    });

    return { id: profile.id, email: profile.email, role: profile.role };
  }
}
