"""
mock_data.py

Generates a realistic stand-in for data/raw_listings.csv while eBay
Production API access is pending. The output has the exact same columns
ebay_api_client.py produces:

    brand, title, price, currency, condition, item_url, fetched_at

A single real collection run only ever produces one fetched_at value, which
makes for a boring "price over time" chart until the pipeline has actually
been run week after week. To make that chart useful right away, this
generates WEEKS_OF_HISTORY separate snapshots — each with its own
backdated fetched_at and its own small price drift — instead of one flat
batch. Only the newest snapshot (fetched_at = now) is meant to represent
"currently active" listings; the backend's "current" endpoints filter down
to it, so the backdated ones only ever show up in /api/trends.

Once live API access comes through, run ebay_api_client.py instead — it
still only produces one snapshot per run, which is correct for real data
(you'd actually run it weekly, rather than fake multiple runs at once).
"""

import random
from datetime import datetime, timedelta, timezone

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

# How many weekly snapshots to backfill, oldest to newest. The last one is
# stamped "now" and is what /api/stats, /api/listings, and /api/deals show
# as the current state; the rest exist purely to give /api/trends more than
# one data point.
WEEKS_OF_HISTORY = 6
NOW = datetime.now(timezone.utc)

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


def price_for(item_type: str, brand: str, condition: str, drift: float = 1.0) -> float:
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
    base *= drift  # week-over-week market movement
    # eBay-style price points: mostly .99 / .95 / .00
    cents = random.choice([0.99, 0.99, 0.95, 0.00, 0.50])
    return round(int(base) + cents, 2)


def fake_item_url() -> str:
    return f"https://www.ebay.com/itm/{random.randint(10**11, 10**12 - 1)}"


def generate_snapshot(fetched_at_iso: str, drift: float) -> list[dict]:
    """One run's worth of listings (~150, across all brands), all stamped
    with the same fetched_at and scaled by drift to simulate that week's
    market movement."""
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
                    "price": price_for(item_type, brand, condition, drift),
                    "currency": CURRENCY,
                    "condition": condition,
                    "item_url": fake_item_url(),
                    "fetched_at": fetched_at_iso,
                }
            )
            made += 1

    return rows


def main():
    rows = []

    # Random walk for the drift multiplier, oldest week first, so brands
    # trend up/down over the backfilled history instead of sitting flat.
    drift = 1.0
    for week_index in range(WEEKS_OF_HISTORY):
        weeks_ago = WEEKS_OF_HISTORY - 1 - week_index
        fetched_at = (NOW - timedelta(weeks=weeks_ago)).isoformat() if weeks_ago else NOW.isoformat()

        rows.extend(generate_snapshot(fetched_at, drift))
        drift = max(0.85, min(1.2, drift * random.uniform(0.95, 1.06)))

    random.shuffle(rows)
    df = pd.DataFrame(rows, columns=CSV_COLUMNS)
    df.to_csv("data/raw_listings.csv", index=False)
    print(f"Wrote {len(df)} mock listings ({WEEKS_OF_HISTORY} weekly snapshots) to data/raw_listings.csv")
    print(df["brand"].value_counts().to_string())
    print("\nMost recent snapshot's avg price by brand:")
    latest = df[df["fetched_at"] == df["fetched_at"].max()]
    print(latest.groupby("brand")["price"].mean().round(2).to_string())
    print("\nSample:")
    print(df.head(8).to_string(index=False))


if __name__ == "__main__":
    main()
