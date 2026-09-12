"""
train_model.py

Trains a RandomForestRegressor to predict price from brand, condition,
and item_type. Saves the trained model + feature importance to disk
for the API to serve.
"""

import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from google.cloud import bigquery
import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.environ["BIGQUERY_PROJECT_ID"]
DATASET = os.environ["BIGQUERY_DATASET"]
TABLE = os.environ["BIGQUERY_TABLE"]

def load_data():
    client = bigquery.Client(project=PROJECT_ID)
    query = f"SELECT brand, condition, item_type, price FROM `{PROJECT_ID}.{DATASET}.{TABLE}`"
    return client.query(query).to_dataframe()

def train():
    df = load_data()
    df = df.dropna(subset=["brand", "condition", "item_type", "price"])

    X = df[["brand", "condition", "item_type"]]
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["brand", "condition", "item_type"])
    ])

    pipeline = Pipeline([
        ("preprocess", preprocessor),
        ("model", RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42))
    ])

    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"MAE: ${mae:.2f} | R2: {r2:.3f}")

    feature_names = pipeline.named_steps["preprocess"].get_feature_names_out()
    importances = pipeline.named_steps["model"].feature_importances_
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances
    }).sort_values("importance", ascending=False)

    joblib.dump(pipeline, "model_artifact.pkl")
    importance_df.to_csv("feature_importance.csv", index=False)
    print("Saved model_artifact.pkl and feature_importance.csv")

if __name__ == "__main__":
    train()
