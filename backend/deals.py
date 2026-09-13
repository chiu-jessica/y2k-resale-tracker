"""
deals.py

Compares each current listing's actual price against the model's
predicted price. Flags listings priced notably below prediction as deals.
"""

import pandas as pd
from google.cloud import bigquery
import joblib
import os
from dotenv import load_dotenv

load_dotenv()
PROJECT_ID = os.environ["BIGQUERY_PROJECT_ID"]
DATASET = os.environ["BIGQUERY_DATASET"]
TABLE = os.environ["BIGQUERY_TABLE"]

_model = joblib.load("model_artifact.pkl")

def find_underpriced_listings(threshold_pct: float = 0.25):
    client = bigquery.Client(project=PROJECT_ID)
    table_ref = f"`{PROJECT_ID}.{DATASET}.{TABLE}`"
    query = f"""
        SELECT title, brand, condition, item_type, price, item_url
        FROM {table_ref}
        WHERE price IS NOT NULL
          -- Only the newest collection run: every run stamps its rows with
          -- one shared fetched_at, so this excludes older runs' listings
          -- from showing up as duplicate "deals" once the collector has
          -- been run more than once.
          AND fetched_at = (SELECT MAX(fetched_at) FROM {table_ref})
    """
    df = client.query(query).to_dataframe()

    X = df[["brand", "condition", "item_type"]]
    df["predicted_price"] = _model.predict(X)
    df["discount_pct"] = (df["predicted_price"] - df["price"]) / df["predicted_price"]

    deals = df[df["discount_pct"] >= threshold_pct].sort_values("discount_pct", ascending=False)
    return deals.to_dict(orient="records")
