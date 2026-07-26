CREATE TABLE IF NOT EXISTS rfq_cases (
  id UUID PRIMARY KEY,
  case_name STRING NOT NULL,
  state JSONB NOT NULL,
  source STRING NOT NULL,
  version INT8 NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES rfq_cases(id),
  event_type STRING NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_events_case_time_idx
  ON agent_events (case_id, created_at);

