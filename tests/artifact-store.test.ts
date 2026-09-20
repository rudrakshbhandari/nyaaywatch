import {
  CreateBucketCommand,
  GetObjectCommand,
  GetBucketTaggingCommand,
  HeadBucketCommand,
  PutBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

const azureBlob = {
  upload: vi.fn(),
  download: vi.fn(),
};
const azureContainer = {
  createIfNotExists: vi.fn(),
  setMetadata: vi.fn(),
  getBlockBlobClient: vi.fn(() => azureBlob),
  getBlobClient: vi.fn(() => azureBlob),
};

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: class {
    constructor() {}
    getContainerClient() {
      return azureContainer;
    }
  },
}));

import { loadConfig } from "../src/config/env.js";
import { AzureBlobArtifactStore, S3ArtifactStore } from "../src/storage/artifact-store.js";

describe("S3ArtifactStore.ensureBucket", () => {
  it("treats already-owned bucket creation as idempotent and preserves existing bucket tags", async () => {
    const store = new S3ArtifactStore(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "staging",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
      }),
    );

    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("missing bucket"))
      .mockRejectedValueOnce(Object.assign(new Error("already owned"), { name: "BucketAlreadyOwnedByYou" }))
      .mockResolvedValueOnce({
        TagSet: [{ Key: "aws:cloudformation:stack-name", Value: "nyaaywatch-staging" }],
      })
      .mockResolvedValueOnce({});

    (store as unknown as { client: { send: typeof send } }).client = { send };

    await expect(store.ensureBucket()).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(4);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(CreateBucketCommand);
    expect(send.mock.calls[2]?.[0]).toBeInstanceOf(GetBucketTaggingCommand);
    expect(send.mock.calls[3]?.[0]).toBeInstanceOf(PutBucketTaggingCommand);
    expect(send.mock.calls[3]?.[0].input.Tagging.TagSet).toEqual([
      { Key: "aws:cloudformation:stack-name", Value: "nyaaywatch-staging" },
      { Key: "project", Value: "nyaaywatch" },
      { Key: "env", Value: "staging" },
    ]);
  });

  it("skips bucket retagging when the desired tags are already present", async () => {
    const store = new S3ArtifactStore(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "staging",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
      }),
    );

    const send = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        TagSet: [
          { Key: "aws:cloudformation:stack-name", Value: "nyaaywatch-staging" },
          { Key: "project", Value: "nyaaywatch" },
          { Key: "env", Value: "staging" },
        ],
      });

    (store as unknown as { client: { send: typeof send } }).client = { send };

    await expect(store.ensureBucket()).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(GetBucketTaggingCommand);
  });
});

describe("S3ArtifactStore.downloadJson", () => {
  it("rejects artifacts whose stored bytes do not match the recorded checksum", async () => {
    const store = new S3ArtifactStore(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        S3_BUCKET: "nyaaywatch-test-artifacts",
        DEPLOY_ENV: "staging",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
      }),
    );

    const send = vi.fn().mockResolvedValueOnce({
      Body: {
        transformToString: async () => JSON.stringify({ ok: true }),
      },
    });

    (store as unknown as { client: { send: typeof send } }).client = { send };

    await expect(
      store.downloadJson("raw/run.json", {
        expectedChecksumSha256: "not-the-recorded-sha",
      }),
    ).rejects.toThrow("checksum mismatch");

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
  });
});

describe("AzureBlobArtifactStore", () => {
  it("uses the configured managed identity and preserves checksums across operations", async () => {
    const store = new AzureBlobArtifactStore(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        STORAGE_PROVIDER: "azure",
        AZURE_STORAGE_ACCOUNT_URL: "https://nyaaywatchproduction.blob.core.windows.net",
        AZURE_STORAGE_CONTAINER: "artifacts",
        AZURE_CLIENT_ID: "11111111-1111-4111-8111-111111111111",
        DEPLOY_ENV: "production",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
      }),
    );
    const payload = { ok: true, count: 3 };
    azureBlob.upload.mockResolvedValueOnce({});
    await expect(store.uploadJson("raw/run.json", payload)).resolves.toMatchObject({
      bucket: "artifacts",
      key: "raw/run.json",
      sizeBytes: JSON.stringify(payload, null, 2).length,
    });

    const body = JSON.stringify(payload, null, 2);
    azureBlob.download.mockResolvedValueOnce({ readableStreamBody: Readable.from([Buffer.from(body)]) });
    await expect(store.downloadJson("raw/run.json")).resolves.toEqual(payload);
    expect(azureBlob.upload).toHaveBeenCalledWith(
      body,
      Buffer.byteLength(body),
      expect.objectContaining({ metadata: expect.objectContaining({ checksumsha256: expect.any(String) }) }),
    );
  });

  it("requires provider-specific storage configuration", () => {
    expect(() => loadConfig({
      NODE_ENV: "test",
      PORT: "3000",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
      AWS_REGION: "ap-south-1",
      STORAGE_PROVIDER: "azure",
      DEPLOY_ENV: "production",
      OPERATOR_API_TOKEN: "operator-test-token",
      STATE_CODE: "HP",
    })).toThrow(/AZURE_STORAGE_ACCOUNT_URL/);
  });

  it("rejects a checksum-mismatched Azure replay before writing the destination", async () => {
    const store = new AzureBlobArtifactStore(
      loadConfig({
        NODE_ENV: "test",
        PORT: "3000",
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
        AWS_REGION: "ap-south-1",
        STORAGE_PROVIDER: "azure",
        AZURE_STORAGE_ACCOUNT_URL: "https://nyaaywatchproduction.blob.core.windows.net",
        AZURE_STORAGE_CONTAINER: "artifacts",
        AZURE_CLIENT_ID: "11111111-1111-4111-8111-111111111111",
        DEPLOY_ENV: "production",
        OPERATOR_API_TOKEN: "operator-test-token",
        STATE_CODE: "HP",
      }),
    );
    const sourceBody = JSON.stringify({ source: "bytes" });
    const checksum = createHash("sha256").update(sourceBody).digest("hex");
    azureBlob.download.mockResolvedValueOnce({ readableStreamBody: Readable.from([Buffer.from(sourceBody)]) });
    azureBlob.upload.mockClear();

    await expect(store.copyObject("raw/source.json", "replay/source.json", { checksumsha256: "wrong" }))
      .rejects.toThrow(/checksum mismatch/);
    expect(azureBlob.upload).not.toHaveBeenCalled();

    azureBlob.download.mockResolvedValueOnce({ readableStreamBody: Readable.from([Buffer.from(sourceBody)]) });
    await expect(store.copyObject("raw/source.json", "replay/source.json", { checksumsha256: checksum }))
      .resolves.toMatchObject({ checksumSha256: checksum, sizeBytes: Buffer.byteLength(sourceBody) });
    expect(azureBlob.upload).toHaveBeenCalledWith(
      sourceBody,
      Buffer.byteLength(sourceBody),
      expect.objectContaining({ metadata: { checksumsha256: checksum } }),
    );
  });
});
