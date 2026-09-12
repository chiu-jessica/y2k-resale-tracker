"""
load_to_bigquery.py

Loads data/cleaned_listings.csv into a BigQuery table.

Requires:
- A GCP project with the BigQuery API enabled
- A service account key, referenced via GOOGLE_APPLICATION_CREDENTIALS
- A .env file (copy .env.example -> .env and fill in your values)
"""

import os
import pandas as pd
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.environ["BIGQUERY_PROJECT_ID"]
DATASET = os.environ.get("BIGQUERY_DATASET", "y2k_resale")
TABLE = os.environ.get("BIGQUERY_TABLE", "listings")

# Explicit schema so fetched_at lands as a real TIMESTAMP (autodetect would
# guess it from the data and can get it wrong).
SCHEMA = [
    bigquery.SchemaField("brand", "STRING"),
    bigquery.SchemaField("title", "STRING"),
    bigquery.SchemaField("price", "FLOAT"),
    bigquery.SchemaField("currency", "STRING"),
    bigquery.SchemaField("condition", "STRING"),
    bigquery.SchemaField("item_url", "STRING"),
    bigquery.SchemaField("item_type", "STRING"),
    bigquery.SchemaField("fetched_at", "TIMESTAMP"),
]


def main():
    df = pd.read_csv("data/cleaned_listings.csv")

    # Ensure fetched_at is datetime, not string, before the load.
    df["fetched_at"] = pd.to_datetime(df["fetched_at"], utc=True)

    client = bigquery.Client(project=PROJECT_ID)
    table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

    job = client.load_table_from_dataframe(
        df,
        table_id,
        job_config=bigquery.LoadJobConfig(
            schema=SCHEMA,
            write_disposition="WRITE_APPEND",
            # Let the append add fetched_at to a table that predates it.
            schema_update_options=[
                bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION
            ],
        ),
    )
    job.result()

    print(f"Loaded {job.output_rows} rows into {table_id}")


if __name__ == "__main__":
    main()
