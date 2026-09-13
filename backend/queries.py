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

# Each collection run (real or mock) stamps every row it writes with the
# same fetched_at, so this picks out exactly one run's worth of listings —
# whichever run is newest. "Current" views (stats/listings/deals) use this
# so re-running the collector doesn't make old snapshots look like
# duplicate live listings; get_price_trends_over_time() deliberately does
# NOT use this, since it needs every run's history.
LATEST_SNAPSHOT_CLAUSE = f"fetched_at = (SELECT MAX(fetched_at) FROM {TABLE_REF})"


def _client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT_ID)


def _records(df):
    """DataFrame -> list[dict] with only JSON-native types (NaN -> null)."""
    return json.loads(df.to_json(orient="records", date_format="iso"))


def get_summary_stats():
    """Total listing count, average price per brand, and the priciest brand —
    for the most recently collected snapshot only."""
    query = f"""
        SELECT
            brand,
            COUNT(*) AS listing_count,
            ROUND(AVG(price), 2) AS avg_price
        FROM {TABLE_REF}
        WHERE price IS NOT NULL AND {LATEST_SNAPSHOT_CLAUSE}
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
    """Listings from the most recent snapshot, narrowed by whichever of
    brand / item_type / condition is supplied. Each of brand / item_type /
    condition may be a single value or a list — a list is matched with
    IN UNNEST(...), so passing several values selects listings matching
    any of them. Uses query parameters, so values are never interpolated
    into the SQL string."""
    clauses = ["price IS NOT NULL", LATEST_SNAPSHOT_CLAUSE]
    params = []

    def add_filter(column: str, value):
        if not value:
            return
        values = value if isinstance(value, (list, tuple, set)) else [value]
        values = [v for v in values if v]
        if not values:
            return
        clauses.append(f"{column} IN UNNEST(@{column})")
        params.append(bigquery.ArrayQueryParameter(column, "STRING", list(values)))

    add_filter("brand", brand)
    add_filter("item_type", item_type)
    add_filter("condition", condition)

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
