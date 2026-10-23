-- Beta applications. Apply this file to the database in BETA_DATABASE_URL.
-- The in-repo script only runs against 127.0.0.1 or localhost.
-- On Neon, run it yourself:
--   psql "$BETA_DATABASE_URL" -f frontend/beta-db/001_beta_application.sql
--
-- Read applications (there is no admin screen):
--   SELECT id, created_at, name, email, github_username, x_handle, repo_url,
--          project_summary, docs_readers, docs_tooling, docs_pain, push_frequency,
--          monthly_pay_usd, feedback_call
--   FROM beta_application
--   ORDER BY created_at DESC;

CREATE TABLE IF NOT EXISTS beta_application (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  github_username text NOT NULL,
  x_handle text,
  repo_url text NOT NULL,
  project_summary text NOT NULL,
  docs_readers text NOT NULL,
  docs_tooling text NOT NULL,
  docs_pain text NOT NULL,
  push_frequency text NOT NULL,
  monthly_pay_usd numeric(12, 2),
  feedback_call boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
