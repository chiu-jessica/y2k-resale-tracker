"""
analyze.py

Runs a few example analysis queries against the BigQuery table
and prints the results. Adjust/add queries as your questions evolve.
"""

import os
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.environ["BIGQUERY_PROJECT_ID"]
DATASET = os.environ.get("BIGQUERY_DATASET", "y2k_resale")
TABLE = os.environ.get("BIGQUERY_TABLE", "listings")
TABLE_ID = f"`{PROJECT_ID}.{DATASET}.{TABLE}`"

QUERIES = {
    "avg_price_by_brand": f"""
        SELECT brand, ROUND(AVG(price), 2) AS avg_price, COUNT(*) AS n
        FROM {TABLE_ID}
        GROUP BY brand
        ORDER BY avg_price DESC
    """,
    "avg_price_by_brand_and_type": f"""
        SELECT brand, item_type, ROUND(AVG(price), 2) AS avg_price, COUNT(*) AS n
        FROM {TABLE_ID}
        GROUP BY brand, item_type
        ORDER BY brand, avg_price DESC
    """,
}


def main():
    client = bigquery.Client(project=PROJECT_ID)

    for name, sql in QUERIES.items():
        print(f"\n--- {name} ---")
        result = client.query(sql).to_dataframe()
        print(result.to_string(index=False))


if __name__ == "__main__":
    main()
