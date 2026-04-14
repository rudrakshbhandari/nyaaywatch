CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  state_code TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_snapshot_at TIMESTAMPTZ NOT NULL,
  methodology_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'published', 'failed', 'replayed')),
  quality_state TEXT NOT NULL CHECK (quality_state IN ('complete', 'partial', 'stale')),
  replay_of_run_id TEXT REFERENCES runs(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS runs_state_code_created_at_idx
  ON runs(state_code, created_at DESC);

CREATE TABLE IF NOT EXISTS run_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS run_artifacts_run_id_idx
  ON run_artifacts(run_id, created_at DESC);

CREATE TABLE IF NOT EXISTS published_snapshots (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  payload_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS published_snapshots_state_code_created_at_idx
  ON published_snapshots(state_code, created_at DESC);

CREATE TABLE IF NOT EXISTS publication_history (
  id TEXT PRIMARY KEY,
  state_code TEXT NOT NULL,
  published_snapshot_id TEXT NOT NULL REFERENCES published_snapshots(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('publish', 'rollback')),
  note TEXT,
  previous_publication_id TEXT REFERENCES publication_history(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS publication_history_state_code_created_at_idx
  ON publication_history(state_code, created_at DESC);
