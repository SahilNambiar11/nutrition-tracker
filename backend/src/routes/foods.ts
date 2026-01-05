import { Router } from "express";
import * as dotenv from "dotenv";

dotenv.config();

const router = Router();

console.log("im awake");

router.get("/search", async (req, res) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  const apiKey = process.env.USDA_API_KEY;

  console.log("USDA API Key:", apiKey ? "Loaded ✅" : "MISSING ❌");

  if (!apiKey) {
    return res.status(500).json({ error: "USDA API key not set in .env" });
  }

  try {
    // Build URL with query params
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("pageSize", "10");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("USDA API error:", response.status);
      return res.status(502).json({ error: "Failed to fetch food data" });
    }

    const data = await response.json();

    const foods = data.foods.map((food: any) => {
      // Helper function to find nutrient value
      const findNutrient = (names: string[]) => {
        for (const name of names) {
          const nutrient = food.foodNutrients.find(
            (n: any) => n.nutrientName === name
          );
          if (nutrient) return nutrient.value;
        }
        return undefined;
      };

      return {
        id: food.fdcId,
        name: food.description,
        calories: findNutrient(["Energy"]),
        protein: findNutrient(["Protein"]),
        carbs: findNutrient(["Carbohydrate, by difference", "Carbohydrate"]),
        fat: findNutrient(["Total lipid (fat)"]),
        unit: "kcal",
      };
    });

    res.json({ foods });
  } catch (error) {
    console.error("Error fetching food data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;