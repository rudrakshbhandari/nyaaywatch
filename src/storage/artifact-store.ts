import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

import type { AppConfig } from "../config/env.js";
import { sha256 } from "../lib/hash.js";

export interface StoredArtifact {
  container: string;
  key: string;
  checksumSha256: string;
  sizeBytes: number;
}

export interface DownloadJsonOptions {
  expectedChecksumSha256?: string | null;
}

export interface ArtifactStore {
  ensureContainer(): Promise<void>;
  uploadJson(key: string, payload: unknown, metadata?: Record<string, string>): Promise<StoredArtifact>;
  copyObject(sourceKey: string, destinationKey: string, metadata?: Record<string, string>): Promise<StoredArtifact>;
  downloadJson<T>(key: string, options?: DownloadJsonOptions): Promise<T>;
}

export class AzureBlobArtifactStore implements ArtifactStore {
  private readonly container;

  constructor(private readonly config: AppConfig) {
    if ((!config.AZURE_STORAGE_CONNECTION_STRING && !config.AZURE_STORAGE_ACCOUNT_URL) || !config.AZURE_STORAGE_CONTAINER) {
      throw new Error(
        "Azure storage requires an account URL or connection string and AZURE_STORAGE_CONTAINER.",
      );
    }

    const service = config.AZURE_STORAGE_CONNECTION_STRING
      ? BlobServiceClient.fromConnectionString(config.AZURE_STORAGE_CONNECTION_STRING)
      : new BlobServiceClient(
          config.AZURE_STORAGE_ACCOUNT_URL!,
          new DefaultAzureCredential({ managedIdentityClientId: config.AZURE_CLIENT_ID }),
        );
    this.container = service.getContainerClient(config.AZURE_STORAGE_CONTAINER);
  }

  async ensureContainer(): Promise<void> {
    await this.container.createIfNotExists();
    await this.container.setMetadata({
      project: "nyaaywatch",
      env: this.config.DEPLOY_ENV,
    });
  }

  async uploadJson(
    key: string,
    payload: unknown,
    metadata: Record<string, string> = {},
  ): Promise<StoredArtifact> {
    const body = JSON.stringify(payload, null, 2);
    const checksumSha256 = sha256(body);
    const blob = this.container.getBlockBlobClient(key);

    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" },
      metadata: { ...metadata, checksumsha256: checksumSha256 },
    });

    return {
      container: this.config.AZURE_STORAGE_CONTAINER!,
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
    const source = await this.downloadBody(sourceKey);
    verifyArtifactChecksum(sourceKey, source, metadata.checksumsha256);
    const checksumSha256 = sha256(source);
    const blob = this.container.getBlockBlobClient(destinationKey);
    await blob.upload(source, Buffer.byteLength(source), {
      blobHTTPHeaders: { blobContentType: "application/json" },
      metadata: { ...metadata, checksumsha256: checksumSha256 },
    });

    return {
      container: this.config.AZURE_STORAGE_CONTAINER!,
      key: destinationKey,
      checksumSha256,
      sizeBytes: Buffer.byteLength(source),
    };
  }

  async downloadJson<T>(key: string, options: DownloadJsonOptions = {}): Promise<T> {
    const body = await this.downloadBody(key);
    verifyArtifactChecksum(key, body, options.expectedChecksumSha256);
    return JSON.parse(body) as T;
  }

  private async downloadBody(key: string): Promise<string> {
    const response = await this.container.getBlobClient(key).download();
    const body = await readableToBuffer(response.readableStreamBody);
    if (body.length === 0) {
      throw new Error(`Artifact ${key} was empty.`);
    }
    return body.toString("utf8");
  }
}

async function readableToBuffer(stream: NodeJS.ReadableStream | undefined): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function createArtifactStore(config: AppConfig): ArtifactStore {
  return new AzureBlobArtifactStore(config);
}

export class InMemoryArtifactStore implements ArtifactStore {
  private readonly objects = new Map<string, string>();

  async ensureContainer(): Promise<void> {
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
      container: "nyaaywatch-test-container",
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
      container: "nyaaywatch-test-container",
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
