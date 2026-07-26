import { randomUUID } from "node:crypto";

const fallbackCases = new Map();
let pool = null;
let schemaReady = false;

async function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!pool) {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      application_name: "forgerelay",
      max: 5,
    });
  }
  if (!schemaReady) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfq_cases (
        id UUID PRIMARY KEY,
        case_name STRING NOT NULL,
        state JSONB NOT NULL,
        source STRING NOT NULL,
        version INT8 NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id UUID PRIMARY KEY,
        case_id UUID NOT NULL REFERENCES rfq_cases(id),
        event_type STRING NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    schemaReady = true;
  }
  return pool;
}

function sanitizeState(analysis, context) {
  return {
    caseName: analysis.caseName,
    facts: analysis.facts,
    missingFields: analysis.missingFields,
    questions: analysis.questions,
    readinessScore: analysis.readinessScore,
    risks: analysis.risks,
    analysisSource: analysis.source,
    contextSource: context.source,
    updatedAt: new Date().toISOString(),
  };
}

export async function createCase(analysis, context) {
  const id = randomUUID();
  const state = sanitizeState(analysis, context);
  const db = await getPool();

  if (!db) {
    const record = {
      id,
      caseName: analysis.caseName,
      state,
      source: "memory-demo",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackCases.set(id, record);
    return record;
  }

  const result = await db.query(
    `INSERT INTO rfq_cases (id, case_name, state, source)
     VALUES ($1, $2, $3, $4)
     RETURNING id, case_name AS "caseName", state, source, version,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, analysis.caseName, state, "cockroachdb"],
  );
  await appendEvent(id, "analysis.completed", {
    readinessScore: analysis.readinessScore,
    source: analysis.source,
  });
  return result.rows[0];
}

export async function appendEvent(caseId, eventType, payload) {
  const db = await getPool();
  if (!db) {
    const record = fallbackCases.get(caseId);
    if (record) {
      record.events ||= [];
      record.events.push({
        id: randomUUID(),
        eventType,
        payload,
        createdAt: new Date().toISOString(),
      });
    }
    return;
  }

  await db.query(
    `INSERT INTO agent_events (id, case_id, event_type, payload)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), caseId, eventType, payload],
  );
}

export async function getCase(caseId) {
  const db = await getPool();
  if (!db) {
    return fallbackCases.get(caseId) ?? null;
  }

  const result = await db.query(
    `SELECT id, case_name AS "caseName", state, source, version,
            created_at AS "createdAt", updated_at AS "updatedAt"
       FROM rfq_cases WHERE id = $1`,
    [caseId],
  );
  if (!result.rows[0]) {
    return null;
  }
  const events = await db.query(
    `SELECT id, event_type AS "eventType", payload,
            created_at AS "createdAt"
       FROM agent_events WHERE case_id = $1 ORDER BY created_at ASC`,
    [caseId],
  );
  return { ...result.rows[0], events: events.rows };
}

export function memoryStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL),
    provider: process.env.DATABASE_URL ? "cockroachdb" : "memory-demo",
  };
}

