"""
etl.py

Cleans the raw scraped listings: parses prices, guesses item category,
removes duplicates and rows with missing prices.

Run after scraper.py. Produces data/cleaned_listings.csv.
"""

import re
import pandas as pd

CATEGORY_KEYWORDS = {
    "hoodie": ["hoodie", "sweatshirt"],
    "tee": ["t-shirt", "tshirt", "tee", "top"],
    "jacket": ["jacket", "coat"],
    "pants": ["pants", "jeans", "sweatpants", "tracksuit"],
    "accessory": ["hat", "bag", "purse", "belt"],
}


def parse_price(price_str: str) -> float | None:
    if not isinstance(price_str, str):
        return None
    match = re.search(r"[\d,]+\.\d{2}", price_str)
    return float(match.group().replace(",", "")) if match else None


def guess_item_type(title: str) -> str:
    title_lower = title.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(k in title_lower for k in keywords):
            return category
    return "other"


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["price"] = df["price_raw"].apply(parse_price)
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
