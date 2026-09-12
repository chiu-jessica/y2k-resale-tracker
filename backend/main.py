from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import queries, model, deals

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/stats")
def get_stats():
    return queries.get_summary_stats()

@app.get("/api/listings")
def get_listings(brand: str = None, item_type: str = None, condition: str = None):
    return queries.get_filtered_listings(brand, item_type, condition)

@app.get("/api/trends")
def get_trends():
    return queries.get_price_trends_over_time()

@app.get("/api/feature-importance")
def get_feature_importance():
    return model.get_feature_importance()

@app.post("/api/predict")
def predict_price(brand: str, condition: str, item_type: str):
    return model.predict(brand, condition, item_type)

@app.get("/api/deals")
def get_deals():
    return deals.find_underpriced_listings()
