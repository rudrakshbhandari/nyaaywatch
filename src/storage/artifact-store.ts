import {
  CopyObjectCommand,
  CreateBucketCommand,
  GetBucketTaggingCommand,
  GetObjectCommand,
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

export interface DownloadJsonOptions {
  expectedChecksumSha256?: string | null;
}

export interface ArtifactStore {
  ensureBucket(): Promise<void>;
  uploadJson(key: string, payload: unknown, metadata?: Record<string, string>): Promise<StoredArtifact>;
  copyObject(sourceKey: string, destinationKey: string, metadata?: Record<string, string>): Promise<StoredArtifact>;
  downloadJson<T>(key: string, options?: DownloadJsonOptions): Promise<T>;
}

type BucketTag = { Key: string; Value: string };

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
      try {
        await this.client.send(
          new CreateBucketCommand({
            Bucket: this.config.S3_BUCKET,
            CreateBucketConfiguration: { LocationConstraint: this.config.AWS_REGION },
          }),
        );
      } catch (error) {
        if (!isBucketAlreadyOwnedError(error)) {
          throw error;
        }
      }
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
        Metadata: { ...metadata, checksumsha256: checksumSha256 },
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

  async downloadJson<T>(key: string, options: DownloadJsonOptions = {}): Promise<T> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.S3_BUCKET,
        Key: key,
      }),
    );

    const body = await response.Body?.transformToString();
    if (!body) {
      throw new Error(`Artifact ${key} was empty.`);
    }

    verifyArtifactChecksum(key, body, options.expectedChecksumSha256);

    return JSON.parse(body) as T;
  }

  private async applyBucketTags(): Promise<void> {
    const existingTags = await this.getExistingBucketTags();
    const desiredTags: BucketTag[] = [
      { Key: "project", Value: "nyaaywatch" },
      { Key: "env", Value: this.config.DEPLOY_ENV },
    ];

    if (bucketHasDesiredTags(existingTags, desiredTags)) {
      return;
    }

    await this.client.send(
      new PutBucketTaggingCommand({
        Bucket: this.config.S3_BUCKET,
        Tagging: {
          TagSet: mergeBucketTags(existingTags, desiredTags),
        },
      }),
    );
  }

  private async getExistingBucketTags(): Promise<BucketTag[]> {
    try {
      const response = await this.client.send(
        new GetBucketTaggingCommand({
          Bucket: this.config.S3_BUCKET,
        }),
      );

      return (response.TagSet ?? []).flatMap((tag) =>
        tag.Key && tag.Value ? [{ Key: tag.Key, Value: tag.Value }] : [],
      );
    } catch (error) {
      const name =
        typeof error === "object" && error !== null && "name" in error && typeof error.name === "string"
          ? error.name
          : undefined;

      if (name === "NoSuchTagSet") {
        return [];
      }

      throw error;
    }
  }
}

function isBucketAlreadyOwnedError(error: unknown): boolean {
  const name =
    typeof error === "object" && error !== null && "name" in error && typeof error.name === "string"
      ? error.name
      : undefined;

  return name === "BucketAlreadyOwnedByYou" || name === "BucketAlreadyExists";
}

function mergeBucketTags(
  existingTags: BucketTag[],
  desiredTags: BucketTag[],
): BucketTag[] {
  const mergedTags = new Map(existingTags.map((tag) => [tag.Key, tag.Value]));

  for (const tag of desiredTags) {
    mergedTags.set(tag.Key, tag.Value);
  }

  return Array.from(mergedTags, ([Key, Value]) => ({ Key, Value }));
}

function bucketHasDesiredTags(existingTags: BucketTag[], desiredTags: BucketTag[]): boolean {
  const existingTagMap = new Map(existingTags.map((tag) => [tag.Key, tag.Value]));

  return desiredTags.every((tag) => existingTagMap.get(tag.Key) === tag.Value);
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

  async downloadJson<T>(key: string, options: DownloadJsonOptions = {}): Promise<T> {
    const body = this.objects.get(key);
    if (!body) {
      throw new Error(`Missing artifact ${key}`);
    }

    verifyArtifactChecksum(key, body, options.expectedChecksumSha256);

    return JSON.parse(body) as T;
  }
}

function verifyArtifactChecksum(key: string, body: string, expectedChecksumSha256?: string | null): void {
  if (!expectedChecksumSha256) {
    return;
  }

  const actualChecksumSha256 = sha256(body);
  if (actualChecksumSha256 !== expectedChecksumSha256) {
    throw new Error(
      `Artifact ${key} checksum mismatch: expected ${expectedChecksumSha256}, received ${actualChecksumSha256}.`,
    );
  }
}
