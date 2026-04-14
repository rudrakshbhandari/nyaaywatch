import {
  CopyObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketTaggingCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { AppConfig } from "../config/env.js";
import { sha256 } from "../lib/hash.js";

export interface StoredArtifact {
  bucket: string;
  key: string;
  checksumSha256: string;
  sizeBytes: number;
}

export interface ArtifactStore {
  ensureBucket(): Promise<void>;
  uploadJson(key: string, payload: unknown, metadata?: Record<string, string>): Promise<StoredArtifact>;
  copyObject(sourceKey: string, destinationKey: string, metadata?: Record<string, string>): Promise<StoredArtifact>;
}

export class S3ArtifactStore implements ArtifactStore {
  private readonly client: S3Client;

  constructor(private readonly config: AppConfig) {
    this.client = new S3Client({
      region: config.AWS_REGION,
      endpoint: config.AWS_ENDPOINT_URL_S3,
      forcePathStyle: config.AWS_S3_FORCE_PATH_STYLE,
      credentials:
        config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: config.AWS_ACCESS_KEY_ID,
              secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.S3_BUCKET }));
      await this.applyBucketTags();
      return;
    } catch {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.config.S3_BUCKET,
          CreateBucketConfiguration: { LocationConstraint: this.config.AWS_REGION },
        }),
      );
      await this.applyBucketTags();
    }
  }

  async uploadJson(
    key: string,
    payload: unknown,
    metadata: Record<string, string> = {},
  ): Promise<StoredArtifact> {
    const body = JSON.stringify(payload, null, 2);
    const checksumSha256 = sha256(body);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: "application/json",
        Metadata: metadata,
      }),
    );

    return {
      bucket: this.config.S3_BUCKET,
      key,
      checksumSha256,
      sizeBytes: Buffer.byteLength(body),
    };
  }

  async copyObject(
    sourceKey: string,
    destinationKey: string,
    metadata: Record<string, string> = {},
  ): Promise<StoredArtifact> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.config.S3_BUCKET,
        CopySource: `${this.config.S3_BUCKET}/${sourceKey}`,
        Key: destinationKey,
        MetadataDirective: "REPLACE",
        Metadata: metadata,
      }),
    );

    const head = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.config.S3_BUCKET,
        Key: destinationKey,
      }),
    );

    return {
      bucket: this.config.S3_BUCKET,
      key: destinationKey,
      checksumSha256: head.Metadata?.checksumsha256 ?? "",
      sizeBytes: Number(head.ContentLength ?? 0),
    };
  }

  private async applyBucketTags(): Promise<void> {
    await this.client.send(
      new PutBucketTaggingCommand({
        Bucket: this.config.S3_BUCKET,
        Tagging: {
          TagSet: [
            { Key: "project", Value: "nyaaywatch" },
            { Key: "env", Value: this.config.DEPLOY_ENV },
          ],
        },
      }),
    );
  }
}

export class InMemoryArtifactStore implements ArtifactStore {
  private readonly objects = new Map<string, string>();

  async ensureBucket(): Promise<void> {
    return;
  }

  async uploadJson(
    key: string,
    payload: unknown,
    _metadata: Record<string, string> = {},
  ): Promise<StoredArtifact> {
    const body = JSON.stringify(payload, null, 2);
    this.objects.set(key, body);
    return {
      bucket: "nyaaywatch-test-artifacts",
      key,
      checksumSha256: sha256(body),
      sizeBytes: Buffer.byteLength(body),
    };
  }

  async copyObject(
    sourceKey: string,
    destinationKey: string,
    _metadata: Record<string, string> = {},
  ): Promise<StoredArtifact> {
    const body = this.objects.get(sourceKey);
    if (!body) {
      throw new Error(`Missing artifact ${sourceKey}`);
    }

    this.objects.set(destinationKey, body);
    return {
      bucket: "nyaaywatch-test-artifacts",
      key: destinationKey,
      checksumSha256: sha256(body),
      sizeBytes: Buffer.byteLength(body),
    };
  }
}
