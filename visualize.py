"""
visualize.py

Generates a couple of quick charts from the cleaned local CSV
(doesn't require BigQuery — useful for a fast first look at the data).
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def main():
    df = pd.read_csv("data/cleaned_listings.csv")

    plt.figure(figsize=(8, 5))
    sns.boxplot(data=df, x="brand", y="price")
    plt.title("Resale Price Distribution by Brand")
    plt.ylabel("Price ($)")
    plt.tight_layout()
    plt.savefig("output/price_by_brand.png")
    print("Saved output/price_by_brand.png")

    plt.figure(figsize=(9, 5))
    sns.barplot(data=df, x="item_type", y="price", hue="brand", estimator="mean")
    plt.title("Average Price by Item Type and Brand")
    plt.ylabel("Average Price ($)")
    plt.tight_layout()
    plt.savefig("output/price_by_type.png")
    print("Saved output/price_by_type.png")


if __name__ == "__main__":
    main()
