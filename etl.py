"""
etl.py

Cleans the raw listings from the eBay Browse API: guesses item category,
drops rows with a missing price, removes duplicates.

Run after ebay_api_client.py (or mock_data.py). Produces
data/cleaned_listings.csv.
"""

import pandas as pd

CATEGORY_KEYWORDS = {
    "hoodie": ["hoodie", "sweatshirt"],
    "tee": ["t-shirt", "tshirt", "tee", "top"],
    "jacket": ["jacket", "coat"],
    "pants": ["pants", "jeans", "sweatpants", "tracksuit"],
    "accessory": ["hat", "bag", "purse", "belt"],
}


def guess_item_type(title: str) -> str:
    title_lower = title.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(k in title_lower for k in keywords):
            return category
    return "other"


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # The API returns price as a number already; coerce just in case a
    # listing came through without one.
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["item_type"] = df["title"].apply(guess_item_type)

    before = len(df)
    df = df.dropna(subset=["price"])
    df = df.drop_duplicates(subset=["title", "price"])
    after = len(df)

    print(f"Cleaned {before} -> {after} rows (removed {before - after})")
    return df


def main():
    raw_df = pd.read_csv("data/raw_listings.csv")
    cleaned_df = clean(raw_df)
    cleaned_df.to_csv("data/cleaned_listings.csv", index=False)
    print("Saved data/cleaned_listings.csv")


if __name__ == "__main__":
    main()
