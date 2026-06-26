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
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET ?? "";
    this.publicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    if (accountId && accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
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
        "R2 storage is not configured (set R2_* env vars)",
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
