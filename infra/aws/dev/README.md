# AWS Dev Resources

Provisioned for this milestone on April 14, 2026:

- S3 bucket: `nyaaywatch-dev-artifacts-723951822728`
- Region: `ap-south-1`
- Tags: `project=nyaaywatch`, `env=dev`

This bucket is isolated to NyaayWatch and intended for raw evidence artifacts plus replay inputs.

## Reprovisioning

Use the repo script:

```bash
./scripts/provision-s3-bucket.sh nyaaywatch-dev-artifacts-723951822728 dev
```

## PostgreSQL

The application now requires a PostgreSQL `DATABASE_URL`, but this milestone does not hard-code a single AWS database product. The runtime is deliberately written against standard PostgreSQL so the same container can target an isolated AWS-hosted Postgres instance without changing the public/API boundary.
