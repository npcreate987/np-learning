/* eslint-disable no-console */
/**
 * One-off: configures CORS on the S3-compatible storage bucket so the browser
 * can PUT (upload) directly via presigned URLs. Run after creating the bucket
 * and pasting the S3_* credentials into apps/api/.env:
 *
 *   pnpm --filter @app/api setup:storage
 *
 * Re-run whenever you add a new web origin (e.g. your production URL) to
 * WEB_ORIGIN in .env.
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand, DeleteBucketCorsCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  for (const candidate of [".env", "apps/api/.env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), candidate), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2];
        }
      }
      return;
    } catch {
      /* try next candidate */
    }
  }
}

loadEnvFile();

const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET ?? process.env.R2_BUCKET;
const endpoint =
  process.env.S3_ENDPOINT ??
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);
const region = process.env.S3_REGION ?? "auto";
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
  console.error(
    "Storage env vars missing. Set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT in apps/api/.env first.",
  );
  process.exit(1);
}

const origins = (process.env.WEB_ORIGIN ?? "http://localhost:3100")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (origins.length === 0) {
  console.error("No origins found in WEB_ORIGIN.");
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials: { accessKeyId, secretAccessKey },
});

(async () => {
  // Show current CORS (best effort) so we can see what's already configured.
  try {
    const existing = await client.send(
      new GetBucketCorsCommand({ Bucket: bucket }),
    );
    console.log("Current CORS rules:", JSON.stringify(existing.CORSRules ?? [], null, 2));
  } catch (err) {
    console.log("No existing CORS config (will create one).");
  }

  // Some S3 implementations (e.g. Supabase) reject PutBucketCors when a config
  // already exists ("The resource already exists"). Clear it first, best effort.
  try {
    await client.send(new DeleteBucketCorsCommand({ Bucket: bucket }));
  } catch {
    /* ignore — may not exist or unsupported */
  }

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: origins,
              AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
              AllowedHeaders: ["*"],
              ExposeHeaders: [
                "ETag",
                "Content-Length",
                "Content-Type",
                "Last-Modified",
              ],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      }),
    );
    console.log(
      `CORS configured on bucket "${bucket}" for origins: ${origins.join(", ")}`,
    );
  } catch (err) {
    // Some providers (e.g. Supabase S3) don't allow PutBucketCors via the S3
    // API and return "The resource already exists". Supabase's endpoint already
    // returns permissive CORS headers (access-control-allow-origin: *), so this
    // is harmless — treat as success.
    const msg = err?.message ?? String(err);
    if (msg.includes("already exists")) {
      console.log(
        `Bucket "${bucket}" CORS is managed by the provider (Supabase returns permissive CORS by default). Nothing to do.`,
      );
    } else {
      throw err;
    }
  }
})().catch((err) => {
  console.error("Failed to configure CORS:", err?.message ?? err);
  process.exit(1);
});
