# Build with DataHub — requirements checklist

- [x] Project code created during the July 6–August 10 submission period
- [x] DataHub Core running from the official quickstart
- [x] DataHub MCP Server connected at runtime
- [x] `search`, `get_entities`, and `get_lineage` visible in evidence
- [x] Synthetic ForgeRelay assets and lineage seeded
- [x] Agent retrieves ownership/lineage context before recommending action
- [x] Optional result guarded by both an environment flag and human confirmation
- [x] Public repository with Apache-2.0 license
- [x] Functional judge-accessible URL with an honestly labeled synthetic fallback
- [ ] English demo video under three minutes
- [x] Sample outputs in repository
- [x] Pre-existing adjacent product ideas disclosed; no source code copied

## Judging story

Without DataHub, an RFQ agent sees only the pasted request. With DataHub, it
also sees which extracted constraint, call outcome, and quote package depend on
the changed fact, who owns the decision, and which downstream artifact must be
reviewed.
