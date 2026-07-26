# CockroachDB × AWS — requirements checklist

- [ ] Project code created during the June 30–August 18 submission period
- [ ] CockroachDB is the persistent agent memory layer
- [ ] AWS service is meaningfully used in the running application
- [ ] Case handoff survives process restart
- [ ] Agent event history is append-only and visible in the demo
- [ ] Source documents, secrets, and full transcripts are excluded from memory
- [ ] Public repository with open-source license
- [ ] Functional demo URL
- [ ] Video under three minutes shows CockroachDB memory at work
- [ ] CockroachDB and AWS tools identified in the submission

## Judging story

Agent A extracts a case, Agent B resumes after an interruption, and the system
proves exactly which structured facts, questions, and supplier outcomes were
available at handoff. CockroachDB preserves the minimum durable memory; AWS
runs the stateless agent step.

