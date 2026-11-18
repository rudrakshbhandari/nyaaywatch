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
    static fromConnectionString() {
      return { getContainerClient: () => azureContainer };
    }
    constructor() {}
    getContainerClient() {
      return azureContainer;
    }
  },
}));

import { loadConfig } from "../src/config/env.js";
import { AzureBlobArtifactStore, createArtifactStore } from "../src/storage/artifact-store.js";

const baseEnv = {
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
  AZURE_STORAGE_ACCOUNT_URL: "https://nyaaywatchtest.blob.core.windows.net",
  AZURE_STORAGE_CONTAINER: "artifacts",
  DEPLOY_ENV: "staging",
  OPERATOR_API_TOKEN: "operator-test-token",
  STATE_CODE: "HP",
};

describe("AzureBlobArtifactStore", () => {
  it("creates the configured container and records its environment metadata", async () => {
    const store = new AzureBlobArtifactStore(loadConfig(baseEnv));

    await store.ensureContainer();

    expect(azureContainer.createIfNotExists).toHaveBeenCalledOnce();
    expect(azureContainer.setMetadata).toHaveBeenCalledWith({ project: "nyaaywatch", env: "staging" });
  });

  it("uses the local Azure Storage connection string when configured", () => {
    const store = createArtifactStore(loadConfig({
      ...baseEnv,
      AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
    }));
    expect(store).toBeInstanceOf(AzureBlobArtifactStore);
  });

  it("preserves checksums across upload and download", async () => {
    const store = new AzureBlobArtifactStore(loadConfig(baseEnv));
    const payload = { ok: true, count: 3 };
    azureBlob.upload.mockResolvedValueOnce({});
    await expect(store.uploadJson("raw/run.json", payload)).resolves.toMatchObject({
      container: "artifacts",
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

  it("rejects a checksum-mismatched replay before writing the destination", async () => {
    const store = new AzureBlobArtifactStore(loadConfig(baseEnv));
    const sourceBody = JSON.stringify({ source: "bytes" });
    const checksum = createHash("sha256").update(sourceBody).digest("hex");
    azureBlob.download.mockImplementation(async () => ({ readableStreamBody: Readable.from([Buffer.from(sourceBody)]) }));
    azureBlob.upload.mockClear();

    await expect(store.copyObject("raw/source.json", "replay/source.json", { checksumsha256: "wrong" }))
      .rejects.toThrow(/checksum mismatch/);
    expect(azureBlob.upload).not.toHaveBeenCalled();

    await expect(store.copyObject("raw/source.json", "replay/source.json", { checksumsha256: checksum }))
      .resolves.toMatchObject({ checksumSha256: checksum, sizeBytes: Buffer.byteLength(sourceBody) });
    expect(azureBlob.upload).toHaveBeenCalledWith(
      sourceBody,
      Buffer.byteLength(sourceBody),
      expect.objectContaining({ metadata: { checksumsha256: checksum } }),
    );
  });

  it("requires an Azure account URL or connection string and a container", () => {
    expect(() => loadConfig({
      NODE_ENV: "test",
      PORT: "3000",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/nyaaywatch",
      DEPLOY_ENV: "production",
      OPERATOR_API_TOKEN: "operator-test-token",
      STATE_CODE: "HP",
    })).toThrow(/AZURE_STORAGE_ACCOUNT_URL/);
    expect(() => loadConfig({
      ...baseEnv,
      AZURE_STORAGE_ACCOUNT_URL: undefined,
      AZURE_STORAGE_CONTAINER: undefined,
      AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
    })).toThrow(/AZURE_STORAGE_CONTAINER/);
  });
});
