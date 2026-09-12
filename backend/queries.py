"""
queries.py

BigQuery read helpers behind the API. Each returns plain
JSON-serializable Python (lists / dicts / floats), not DataFrames.

Note: the scrape/collect timestamp column is `fetched_at` (renamed from
`scraped_at` when the project moved to the eBay API). Only rows loaded
after that column was added have it populated.
"""

import json
import os

from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.environ["BIGQUERY_PROJECT_ID"]
DATASET = os.environ["BIGQUERY_DATASET"]
TABLE = os.environ["BIGQUERY_TABLE"]

TABLE_REF = f"`{PROJECT_ID}.{DATASET}.{TABLE}`"


def _client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT_ID)


def _records(df):
    """DataFrame -> list[dict] with only JSON-native types (NaN -> null)."""
    return json.loads(df.to_json(orient="records", date_format="iso"))


def get_summary_stats():
    """Total listing count, average price per brand, and the priciest brand."""
    query = f"""
        SELECT
            brand,
            COUNT(*) AS listing_count,
            ROUND(AVG(price), 2) AS avg_price
        FROM {TABLE_REF}
        WHERE price IS NOT NULL
        GROUP BY brand
        ORDER BY avg_price DESC
    """
    df = _client().query(query).to_dataframe()
    by_brand = _records(df)

    return {
        "total_listings": int(df["listing_count"].sum()) if not df.empty else 0,
        "avg_price_by_brand": by_brand,
        "highest_avg_price_brand": by_brand[0]["brand"] if by_brand else None,
    }


def get_filtered_listings(brand=None, item_type=None, condition=None):
    """All listings, narrowed by whichever of brand / item_type / condition
    is supplied. Uses query parameters, so the values are not interpolated
    into the SQL string."""
    clauses = ["price IS NOT NULL"]
    params = []

    if brand:
        clauses.append("brand = @brand")
        params.append(bigquery.ScalarQueryParameter("brand", "STRING", brand))
    if item_type:
        clauses.append("item_type = @item_type")
        params.append(bigquery.ScalarQueryParameter("item_type", "STRING", item_type))
    if condition:
        clauses.append("condition = @condition")
        params.append(bigquery.ScalarQueryParameter("condition", "STRING", condition))

    query = f"""
        SELECT
            title,
            brand,
            condition,
            item_type,
            price,
            item_url,
            CAST(fetched_at AS STRING) AS fetched_at
        FROM {TABLE_REF}
        WHERE {' AND '.join(clauses)}
        ORDER BY price DESC
    """
    job_config = bigquery.QueryJobConfig(query_parameters=params)
    df = _client().query(query, job_config=job_config).to_dataframe()
    return _records(df)


def get_price_trends_over_time():
    """Average price per brand over time. Buckets by week (DATE_TRUNC ... WEEK)
    since a single collection run only produces one day of data."""
    query = f"""
        SELECT
            brand,
            DATE(DATE_TRUNC(fetched_at, WEEK)) AS week,
            ROUND(AVG(price), 2) AS avg_price,
            COUNT(*) AS listing_count
        FROM {TABLE_REF}
        WHERE price IS NOT NULL AND fetched_at IS NOT NULL
        GROUP BY brand, week
        ORDER BY week, brand
    """
    df = _client().query(query).to_dataframe()
    return _records(df)
