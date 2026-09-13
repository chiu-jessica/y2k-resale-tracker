# Y2K Resale Price Tracker

Tracking **active** resale prices for Y2K brands to see which holds value best
and what factors (condition, item type) affect price.

Brands tracked: **Ed Hardy**, **Baby Phat**, **Juicy Couture**.

## Architecture

| Part | What it is |
| --- | --- |
| **Data pipeline** | `ebay_api_client.py` → `etl.py` → `load_to_bigquery.py`. Collects/cleans listings and appends them, timestamped, to a BigQuery table. |
| **Backend** | FastAPI (`backend/`) serving stats, filtered listings, price trends, underpriced-deal detection, and price predictions from a scikit-learn `RandomForestRegressor` trained on the BigQuery data. |
| **Frontend** | Next.js + Recharts (`frontend/`) — Dashboard, Trends, Predictor, and Deals pages, all reading from the backend API. |
| **Automation** | A scheduled GitHub Actions workflow (`.github/workflows/scrape.yml`) that runs the pipeline and retrains the model automatically. |

See [Pipeline](#pipeline) and [Automation](#automation) below for details on each.

### Frontend pages

- **Dashboard** — filterable charts of average price by brand and item type
- **Trends** — price history per brand over time, as new eBay data accumulates
- **Predictor** — estimate a listing's price from brand, condition, and item
  type, and see which features the model weighs most heavily
- **Deals** — currently active listings priced well below what the model
  predicts for a similar item

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
- extracts `title`, `price`, `currency`, `condition`, and `item_url`, and stamps
  every row with `fetched_at` (UTC, the moment the script runs)
- writes everything to `data/raw_listings.csv`

### 2. Clean

`etl.py` coerces `price` to a number, drops rows without a price, removes
duplicate `(title, price)` pairs, derives an `item_type`
(`hoodie` / `tee` / `jacket` / `pants` / `accessory` / `other`) from keywords
in the title via `guess_item_type()`, and parses `fetched_at` to a real
datetime.

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
pip install -r backend/requirements.txt
cp .env.example .env   # then fill in your values
```

`.env` keys (shared by the pipeline scripts and the backend):

| Key | Purpose |
| --- | --- |
| `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` | eBay developer app keyset (Production) |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to a GCP service-account key JSON |
| `BIGQUERY_PROJECT_ID`, `BIGQUERY_DATASET`, `BIGQUERY_TABLE` | load target |

The BigQuery dataset must already exist; the table is created on first load.

Frontend dependencies (separate from the Python setup above):

```
cd frontend
npm install
```

## Running the App

The backend and frontend are two separate processes and **both must be
running at the same time**, in two terminals, for the app to work end to
end — the frontend fetches everything it shows from the backend API.

### First-time setup (or after pulling in new data)

From the repo root, with `.env` and your GCP key already in place:

```
python ebay_api_client.py
python etl.py
python load_to_bigquery.py
python backend/train_model.py  # writes model_artifact.pkl + feature_importance.csv
```

### Every time — start both servers

**Terminal 1 — backend** (from the repo root — not `backend/`, since that's
where `.env`, the GCP key, and the trained model files live):

```
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Runs on **http://localhost:8000** (interactive docs at `/docs`).

**Terminal 2 — frontend** (from `frontend/`):

```
cd frontend
npm run dev
```

Runs on **http://localhost:3000**.

With both running, open **http://localhost:3000** in a browser.

## Automation

`.github/workflows/scrape.yml` runs on a schedule (and can be triggered
manually from the GitHub Actions tab). Each run:

1. Collects and cleans a fresh batch of listings
2. Loads them into BigQuery
3. Retrains the model on the updated table (`backend/train_model.py`), so
   the deployed model's predictions and feature importances stay current as
   more scrape history accumulates

It authenticates with the same GCP service-account key (`GCP_KEY_JSON`
secret) and `BIGQUERY_PROJECT_ID` secret used by the load step.

## Findings

> TBD
