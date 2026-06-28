import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

@Injectable()
export class UploadsService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    // Generic S3-compatible storage. Works with Cloudflare R2 (set R2_*) or
    // Supabase Storage's S3 endpoint (set S3_*). S3_* takes precedence.
    const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET ?? process.env.R2_BUCKET ?? "";
    this.publicUrl = (process.env.S3_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    const endpoint =
      process.env.S3_ENDPOINT ??
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined);
    const region = process.env.S3_REGION ?? "auto";
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

    if (accessKeyId && secretAccessKey && this.bucket && endpoint) {
      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
    }
  }

  /**
   * Returns a presigned PUT url the browser can upload directly to, plus the
   * public url the asset will be reachable at afterwards.
   */
  async presign(params: {
    userId: string;
    filename: string;
    contentType: string;
  }) {
    if (!this.client) {
      throw new InternalServerErrorException(
        "Object storage is not configured (set S3_* env vars)",
      );
    }

    const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${params.userId}/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 600,
    });

    return {
      uploadUrl,
      publicUrl: `${this.publicUrl}/${key}`,
      key,
    };
  }
}
