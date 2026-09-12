"""
mock_data.py

Generates a realistic stand-in for data/raw_listings.csv while eBay
Production API access is pending. The output has the exact same columns
ebay_api_client.py produces:

    brand, title, price, currency, condition, item_url

Once live API access comes through, run ebay_api_client.py instead — the
rest of the pipeline (etl.py -> load_to_bigquery.py -> analyze.py) is
unchanged.
"""

import random
from datetime import datetime, timezone

import pandas as pd

SEED = 20260910
random.seed(SEED)

CURRENCY = "USD"
CSV_COLUMNS = [
    "brand",
    "title",
    "price",
    "currency",
    "condition",
    "item_url",
    "fetched_at",
]

# One UTC timestamp per run, captured when the script starts, so the
# downstream table can distinguish one API pull from the next.
FETCHED_AT = datetime.now(timezone.utc).isoformat()

# condition -> relative weight (vintage resale skews used)
CONDITIONS = {
    "New": 1,
    "New without tags": 2,
    "Pre-owned": 6,
    "Very Good": 3,
}

# item type -> (title noun options, base price range). The nouns contain the
# keywords etl.guess_item_type() looks for (hoodie/sweatshirt, tee/top,
# jacket/coat, pants/jeans/tracksuit, hat/bag/purse/belt).
ITEM_TYPES = {
    "hoodie": (["Hoodie", "Zip Hoodie", "Pullover Hoodie", "Sweatshirt", "Crewneck Sweatshirt"], (28, 95)),
    "tee": (["Tee", "Baby Tee", "Graphic Tee", "Ringer Tee", "Tank Top", "Mesh Top", "Halter Top"], (18, 70)),
    "jacket": (["Trucker Jacket", "Denim Jacket", "Bomber Jacket", "Puffer Coat", "Faux Fur Coat", "Track Jacket"], (45, 180)),
    "pants": (["Cargo Pants", "Flare Jeans", "Low Rise Jeans", "Sweatpants", "Velour Tracksuit", "Tracksuit Bottoms"], (35, 140)),
    "bag": (["Shoulder Bag", "Mini Bag", "Tote Bag", "Trucker Hat", "Studded Belt", "Logo Belt"], (22, 120)),
}

# brand -> (adjective pool, multiplier applied to base price, condition tweak)
BRANDS = {
    "Ed Hardy": {
        "adjectives": ["Tiger", "Koi Fish", "Skull", "Rose", "Dragon", "Love Kills Slowly", "Rhinestone", "Tattoo Print"],
        "eras": ["Y2K", "2000s", "Vintage", "Early 2000s"],
        "price_mult": 1.15,
    },
    "Baby Phat": {
        "adjectives": ["Cat Logo", "Rhinestone", "Velour", "Metallic", "Pink", "Fur Trim", "Logo", "Kimora Lee"],
        "eras": ["Y2K", "2000s", "Vintage", "Deadstock"],
        "price_mult": 1.0,
    },
    "Juicy Couture": {
        "adjectives": ["Velour", "Terrycloth", "Bling", "Crown Logo", "Pastel", "Monogram", "Gothic Logo", "Charm"],
        "eras": ["Y2K", "2000s", "Vintage", "Early 2000s"],
        "price_mult": 1.1,
    },
}

SIZES = ["XS", "S", "M", "L", "XL", "Juniors S", "Juniors M", "Women's 4", "Women's 6", "Women's 8"]

CONDITION_NOTES = {
    "New": "NWT",
    "New without tags": "NWOT",
    "Pre-owned": "",
    "Very Good": "EUC",
}


def weighted_condition() -> str:
    choices, weights = zip(*CONDITIONS.items())
    return random.choices(choices, weights=weights, k=1)[0]


def make_title(brand: str, era: str, adj: str, noun: str, size: str, condition: str) -> str:
    parts = [brand, era, adj, noun]
    if random.random() < 0.7:
        parts.append(f"Size {size}")
    note = CONDITION_NOTES[condition]
    if note and random.random() < 0.6:
        parts.append(note)
    if random.random() < 0.25:
        parts.append(random.choice(["Rare", "Authentic", "Y2K Grunge", "As Is", "Read Description"]))
    return " ".join(parts)


def price_for(item_type: str, brand: str, condition: str) -> float:
    low, high = ITEM_TYPES[item_type][1]
    base = random.uniform(low, high)
    base *= BRANDS[brand]["price_mult"]
    cond_mult = {
        "New": 1.35,
        "New without tags": 1.15,
        "Very Good": 1.0,
        "Pre-owned": 0.85,
    }[condition]
    base *= cond_mult
    base *= random.uniform(0.9, 1.1)  # listing-to-listing noise
    # eBay-style price points: mostly .99 / .95 / .00
    cents = random.choice([0.99, 0.99, 0.95, 0.00, 0.50])
    return round(int(base) + cents, 2)


def fake_item_url() -> str:
    return f"https://www.ebay.com/itm/{random.randint(10**11, 10**12 - 1)}"


def main():
    rows = []
    seen_titles = set()

    for brand, meta in BRANDS.items():
        n = random.randint(48, 54)  # ~150 total across three brands
        made = 0
        while made < n:
            item_type = random.choice(list(ITEM_TYPES.keys()))
            noun = random.choice(ITEM_TYPES[item_type][0])
            adj = random.choice(meta["adjectives"])
            era = random.choice(meta["eras"])
            size = random.choice(SIZES)
            condition = weighted_condition()

            title = make_title(brand, era, adj, noun, size, condition)
            if title in seen_titles:
                continue
            seen_titles.add(title)

            rows.append(
                {
                    "brand": brand,
                    "title": title,
                    "price": price_for(item_type, brand, condition),
                    "currency": CURRENCY,
                    "condition": condition,
                    "item_url": fake_item_url(),
                    "fetched_at": FETCHED_AT,
                }
            )
            made += 1

    random.shuffle(rows)
    df = pd.DataFrame(rows, columns=CSV_COLUMNS)
    df.to_csv("data/raw_listings.csv", index=False)
    print(f"Wrote {len(df)} mock listings to data/raw_listings.csv")
    print(df["brand"].value_counts().to_string())
    print("\nSample:")
    print(df.head(8).to_string(index=False))


if __name__ == "__main__":
    main()
