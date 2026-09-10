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


def main():
    df = pd.read_csv("data/cleaned_listings.csv")

    client = bigquery.Client(project=PROJECT_ID)
    table_id = f"{PROJECT_ID}.{DATASET}.{TABLE}"

    job = client.load_table_from_dataframe(
        df,
        table_id,
        job_config=bigquery.LoadJobConfig(write_disposition="WRITE_APPEND"),
    )
    job.result()

    print(f"Loaded {job.output_rows} rows into {table_id}")


if __name__ == "__main__":
    main()
