import {
  CreateBucketCommand,
  GetBucketTaggingCommand,
  HeadBucketCommand,
  PutBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { loadConfig } from "../src/config/env.js";
import { S3ArtifactStore } from "../src/storage/artifact-store.js";

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
