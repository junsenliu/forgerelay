"""Seed a synthetic ForgeRelay lineage graph in DataHub Core.

This script never reads local customer files. It creates five small synthetic
datasets that represent the RFQ clarification evidence chain.
"""

from datahub.metadata.urns import DatasetUrn
from datahub.sdk import DataHubClient, Dataset


SCHEMAS = {
    "synthetic.rfq_source": [
        ("case_id", "varchar(64)", "Synthetic ForgeRelay case identifier"),
        ("source_text", "text", "Synthetic or authorized RFQ text"),
        ("revision", "varchar(32)", "RFQ source revision"),
    ],
    "synthetic.extracted_constraints": [
        ("case_id", "varchar(64)", "ForgeRelay case identifier"),
        ("material", "varchar(120)", "Explicit material statement"),
        ("process", "varchar(120)", "Explicit manufacturing process"),
        ("tolerance", "varchar(120)", "Explicit critical tolerance"),
    ],
    "synthetic.clarification_plan": [
        ("case_id", "varchar(64)", "ForgeRelay case identifier"),
        ("question_id", "varchar(64)", "Stable clarification question identifier"),
        ("severity", "varchar(20)", "Blocking, important, or minor"),
    ],
    "synthetic.supplier_call_result": [
        ("case_id", "varchar(64)", "ForgeRelay case identifier"),
        ("question_id", "varchar(64)", "Clarification question identifier"),
        ("answer", "text", "Structured supplier response"),
        ("evidence_status", "varchar(20)", "Confirmed, unknown, or conflicting"),
    ],
    "synthetic.quote_ready_package": [
        ("case_id", "varchar(64)", "ForgeRelay case identifier"),
        ("readiness_score", "int", "Quote readiness score from 0 to 100"),
        ("open_blockers", "int", "Number of unresolved blocking fields"),
    ],
}

LINEAGE = [
    ("synthetic.rfq_source", "synthetic.extracted_constraints"),
    ("synthetic.extracted_constraints", "synthetic.clarification_plan"),
    ("synthetic.clarification_plan", "synthetic.supplier_call_result"),
    ("synthetic.supplier_call_result", "synthetic.quote_ready_package"),
]


def dataset_urn(name: str) -> DatasetUrn:
    return DatasetUrn(platform="forgerelay", name=name, env="PROD")


def main() -> None:
    client = DataHubClient.from_env()

    for name, schema in SCHEMAS.items():
        dataset = Dataset(
            platform="forgerelay",
            name=name,
            schema=schema,
            owners=["rfq-engineering"],
            description=(
                "Synthetic ForgeRelay hackathon asset. Contains no customer data."
            ),
            custom_properties={
                "synthetic": "true",
                "owner_team": "RFQ Engineering",
            },
        )
        client.entities.upsert(dataset)

    for upstream, downstream in LINEAGE:
        client.lineage.add_lineage(
            upstream=dataset_urn(upstream),
            downstream=dataset_urn(downstream),
        )

    print(
        f"Seeded {len(SCHEMAS)} synthetic datasets and "
        f"{len(LINEAGE)} lineage edges."
    )


if __name__ == "__main__":
    main()
