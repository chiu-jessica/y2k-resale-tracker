# Y2K Resale Price Tracker

Tracking **active** resale prices for Y2K brands to see which holds value best
and what factors (condition, item type) affect price.

Brands tracked: **Ed Hardy**, **Baby Phat**, **Juicy Couture**.

## Pipeline

| Step | Script | Output |
| --- | --- | --- |
| 1. Collect | `ebay_api_client.py` | `data/raw_listings.csv` |
| 2. Clean | `etl.py` | `data/cleaned_listings.csv` |
| 3. Load | `load_to_bigquery.py` | BigQuery table `y2k_resale.listings` |
| 4. Analyze | `analyze.py` | printed summary tables |
| 5. Visualize | `visualize.py` | `output/*.png` |

### 1. Collect — eBay Browse API

`ebay_api_client.py` pulls **currently active listings** from eBay's
[Browse API](https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search)
(`buy/browse/v1/item_summary/search`). For each brand it:

- reads `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` from `.env`
- gets an OAuth application token via the client-credentials grant
  (`POST https://api.ebay.com/identity/v1/oauth2/token`)
- queries `item_summary/search` for the brand name
- extracts `title`, `price`, `currency`, `condition`, and `item_url`
- writes everything to `data/raw_listings.csv`

### 2. Clean

`etl.py` coerces `price` to a number, drops rows without a price, removes
duplicate `(title, price)` pairs, and derives an `item_type`
(`hoodie` / `tee` / `jacket` / `pants` / `accessory` / `other`) from keywords
in the title via `guess_item_type()`.

### 3–5. Load, analyze, visualize

`load_to_bigquery.py` appends `data/cleaned_listings.csv` to the BigQuery
table named by `.env`. `analyze.py` runs summary queries (average price by
brand, and by brand × item type). `visualize.py` writes a price-distribution
box plot and an average-price bar chart to `output/`.

## Setup

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # then fill in your values
```

`.env` keys:

| Key | Purpose |
| --- | --- |
| `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` | eBay developer app keyset (Production) |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to a GCP service-account key JSON |
| `BIGQUERY_PROJECT_ID`, `BIGQUERY_DATASET`, `BIGQUERY_TABLE` | load target |

The BigQuery dataset must already exist; the table is created on first load.

## Findings

> TBD
