ALTER TABLE runs
  ADD COLUMN IF NOT EXISTS scope_type TEXT;

ALTER TABLE runs
  ADD COLUMN IF NOT EXISTS scope_code TEXT;

UPDATE runs
SET
  scope_type = CASE
    WHEN state_code = 'SCI' THEN 'supreme_court'
    WHEN state_code LIKE '%HC' THEN 'high_court'
    ELSE 'lower_court_state'
  END,
  scope_code = state_code
WHERE scope_type IS NULL OR scope_code IS NULL;

ALTER TABLE runs
  ALTER COLUMN scope_type SET NOT NULL;

ALTER TABLE runs
  ALTER COLUMN scope_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS runs_scope_identity_created_at_idx
  ON runs(scope_type, scope_code, created_at DESC);

ALTER TABLE published_snapshots
  ADD COLUMN IF NOT EXISTS scope_type TEXT;

ALTER TABLE published_snapshots
  ADD COLUMN IF NOT EXISTS scope_code TEXT;

UPDATE published_snapshots
SET
  scope_type = CASE
    WHEN state_code = 'SCI' THEN 'supreme_court'
    WHEN state_code LIKE '%HC' THEN 'high_court'
    ELSE 'lower_court_state'
  END,
  scope_code = state_code
WHERE scope_type IS NULL OR scope_code IS NULL;

ALTER TABLE published_snapshots
  ALTER COLUMN scope_type SET NOT NULL;

ALTER TABLE published_snapshots
  ALTER COLUMN scope_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS published_snapshots_scope_identity_created_at_idx
  ON published_snapshots(scope_type, scope_code, created_at DESC);

ALTER TABLE publication_history
  ADD COLUMN IF NOT EXISTS scope_type TEXT;

ALTER TABLE publication_history
  ADD COLUMN IF NOT EXISTS scope_code TEXT;

UPDATE publication_history
SET
  scope_type = CASE
    WHEN state_code = 'SCI' THEN 'supreme_court'
    WHEN state_code LIKE '%HC' THEN 'high_court'
    ELSE 'lower_court_state'
  END,
  scope_code = state_code
WHERE scope_type IS NULL OR scope_code IS NULL;

ALTER TABLE publication_history
  ALTER COLUMN scope_type SET NOT NULL;

ALTER TABLE publication_history
  ALTER COLUMN scope_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS publication_history_scope_identity_created_at_idx
  ON publication_history(scope_type, scope_code, created_at DESC);
