"""
scraper.py

Scrapes eBay 'sold/completed' listings for a set of brands.
Run this first — it produces data/raw_listings.csv.

NOTE: eBay's HTML structure changes periodically. If the selectors below
return no results, open the live search page in your browser's DevTools,
inspect a listing element, and update the CSS selectors accordingly.
"""

import time
import random
import requests
from bs4 import BeautifulSoup
import pandas as pd

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

BRANDS = ["Ed Hardy", "Baby Phat", "Juicy Couture"]
MAX_PAGES_PER_BRAND = 3  # start small while testing


def scrape_sold_listings(brand: str, max_pages: int = MAX_PAGES_PER_BRAND) -> list[dict]:
    """Scrape sold/completed listings for a single brand across a few pages."""
    results = []

    for page in range(1, max_pages + 1):
        url = (
            "https://www.ebay.com/sch/i.html"
            f"?_nkw={brand.replace(' ', '+')}"
            "&LH_Sold=1&LH_Complete=1"
            f"&_pgn={page}"
        )

        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            print(f"  [warn] page {page} for '{brand}' returned status {resp.status_code}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        listings = soup.select(".s-item")

        page_count = 0
        for item in listings:
            title_el = item.select_one(".s-item__title")
            price_el = item.select_one(".s-item__price")
            date_el = item.select_one(".s-item__ended-date, .s-item__title--tag")

            if not title_el or not price_el:
                continue

            results.append({
                "brand": brand,
                "title": title_el.get_text(strip=True),
                "price_raw": price_el.get_text(strip=True),
                "sold_date_raw": date_el.get_text(strip=True) if date_el else None,
            })
            page_count += 1

        print(f"  page {page}: {page_count} listings found")
        time.sleep(random.uniform(2, 5))  # be polite — avoid hammering the server

    return results


def main():
    all_results = []
    for brand in BRANDS:
        print(f"Scraping: {brand}")
        all_results.extend(scrape_sold_listings(brand))

    df = pd.DataFrame(all_results)
    df.to_csv("data/raw_listings.csv", index=False)
    print(f"\nSaved {len(df)} total listings to data/raw_listings.csv")


if __name__ == "__main__":
    main()
