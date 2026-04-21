CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id          TEXT        PRIMARY KEY,
  email       TEXT        NOT NULL,
  scope       TEXT        NOT NULL DEFAULT 'national',
  token       TEXT        NOT NULL UNIQUE,
  confirmed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  CONSTRAINT newsletter_subscriptions_email_scope_key UNIQUE (email, scope)
);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_token_idx
  ON newsletter_subscriptions(token);

CREATE INDEX IF NOT EXISTS newsletter_subscriptions_scope_confirmed_idx
  ON newsletter_subscriptions(scope, confirmed)
  WHERE unsubscribed_at IS NULL;
