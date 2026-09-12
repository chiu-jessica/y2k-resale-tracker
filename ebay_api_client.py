"""
ebay_api_client.py

Pulls active listings for a set of Y2K brands from eBay's Browse API
(buy/browse/v1/item_summary/search) and writes them to data/raw_listings.csv.

Run this first — it produces data/raw_listings.csv, which etl.py then cleans.

Auth: OAuth 2.0 client credentials grant. Set EBAY_CLIENT_ID and
EBAY_CLIENT_SECRET in .env (App ID / Cert ID from your eBay developer
account, Production keyset).

NOTE: this requires Production API access on your eBay developer account.
While that is pending, use mock_data.py to generate a stand-in CSV with the
same columns.
"""

import base64
import os
from datetime import datetime, timezone

import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()

OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
SCOPE = "https://api.ebay.com/oauth/api_scope"

BRANDS = ["Ed Hardy", "Baby Phat", "Juicy Couture"]
RESULTS_PER_BRAND = 200  # eBay caps limit at 200 per request

# Stamp every row from a single run with the same UTC timestamp, captured
# the moment the script starts. This is what lets BigQuery build a real
# price-over-time series across API pulls.
FETCHED_AT = datetime.now(timezone.utc).isoformat()

CSV_COLUMNS = [
    "brand",
    "title",
    "price",
    "currency",
    "condition",
    "item_url",
    "fetched_at",
]


def get_access_token() -> str:
    """Exchange the app client id/secret for an application access token."""
    client_id = os.environ["EBAY_CLIENT_ID"]
    client_secret = os.environ["EBAY_CLIENT_SECRET"]

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = requests.post(
        OAUTH_URL,
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials", "scope": SCOPE},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def search_brand(brand: str, token: str, limit: int = RESULTS_PER_BRAND) -> list[dict]:
    """Return a list of listing dicts for a single brand."""
    resp = requests.get(
        SEARCH_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        params={"q": brand, "limit": limit},
        timeout=30,
    )
    resp.raise_for_status()
    items = resp.json().get("itemSummaries", []) or []

    rows = []
    for item in items:
        price = item.get("price") or {}
        rows.append(
            {
                "brand": brand,
                "title": item.get("title"),
                "price": price.get("value"),
                "currency": price.get("currency"),
                "condition": item.get("condition"),
                "item_url": item.get("itemWebUrl"),
                "fetched_at": FETCHED_AT,
            }
        )
    print(f"  {brand}: {len(rows)} listings")
    return rows


def main():
    token = get_access_token()

    all_rows = []
    for brand in BRANDS:
        print(f"Searching: {brand}")
        all_rows.extend(search_brand(brand, token))

    df = pd.DataFrame(all_rows, columns=CSV_COLUMNS)
    df.to_csv("data/raw_listings.csv", index=False)
    print(f"\nSaved {len(df)} total listings to data/raw_listings.csv")


if __name__ == "__main__":
    main()
