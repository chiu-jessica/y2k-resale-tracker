import joblib
import pandas as pd

_model = joblib.load("model_artifact.pkl")
_importance = pd.read_csv("feature_importance.csv")

def predict(brand: str, condition: str, item_type: str):
    X = pd.DataFrame([{"brand": brand, "condition": condition, "item_type": item_type}])
    prediction = _model.predict(X)[0]
    return {"predicted_price": round(float(prediction), 2)}

def get_feature_importance():
    return _importance.to_dict(orient="records")
