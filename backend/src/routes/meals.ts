import { Router } from "express";
import { Pool } from "pg";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all meals for a specific date
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const date = req.query.date as string;

  if (!date) {
    return res.status(400).json({ error: "Date parameter required" });
  }

  try {
    const mealsResult = await pool.query(
      `SELECT id, name, meal_date, created_at 
       FROM meals 
       WHERE user_id = $1 AND meal_date = $2
       ORDER BY created_at ASC`,
      [userId, date]
    );

    const meals = mealsResult.rows;

    const mealsWithFoods = await Promise.all(
      meals.map(async (meal) => {
        const foodsResult = await pool.query(
          `SELECT id, food_id, food_name, calories, protein, carbs, fat, servings
           FROM meal_foods
           WHERE meal_id = $1`,
          [meal.id]
        );

        return {
          id: meal.id,
          name: meal.name,
          foods: foodsResult.rows.map((food) => ({
            id: food.food_id,
            recordId: food.id, // ADD THIS LINE - the database record ID
            name: food.food_name,
            calories: parseFloat(food.calories) || 0,
            protein: food.protein ? parseFloat(food.protein) : undefined,
            carbs: food.carbs ? parseFloat(food.carbs) : undefined,
            fat: food.fat ? parseFloat(food.fat) : undefined,
          })),
        };
      })
    );

    res.json({ meals: mealsWithFoods });
  } catch (error) {
    console.error("Get meals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CREATE a new meal
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { name, date } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: "Name and date required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO meals (user_id, name, meal_date) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, meal_date, created_at`,
      [userId, name, date]
    );

    const meal = result.rows[0];

    res.status(201).json({
      meal: {
        id: meal.id,
        name: meal.name,
        foods: [],
      },
    });
  } catch (error) {
    console.error("Create meal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE a meal
router.delete("/:mealId", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const mealId = parseInt(req.params.mealId);

  try {
    // Verify meal belongs to user
    const mealCheck = await pool.query(
      "SELECT id FROM meals WHERE id = $1 AND user_id = $2",
      [mealId, userId]
    );

    if (mealCheck.rows.length === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Delete meal (CASCADE will delete associated foods)
    await pool.query("DELETE FROM meals WHERE id = $1", [mealId]);

    res.json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ADD FOOD to a meal
router.post("/:mealId/foods", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const mealId = parseInt(req.params.mealId);
  const { foodId, foodName, calories, protein, carbs, fat } = req.body;

  if (!foodId || !foodName) {
    return res.status(400).json({ error: "Food ID and name required" });
  }

  try {
    // Verify meal belongs to user
    const mealCheck = await pool.query(
      "SELECT id FROM meals WHERE id = $1 AND user_id = $2",
      [mealId, userId]
    );

    if (mealCheck.rows.length === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Add food to meal
    const result = await pool.query(
      `INSERT INTO meal_foods (meal_id, food_id, food_name, calories, protein, carbs, fat)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [mealId, foodId, foodName, calories || 0, protein, carbs, fat]
    );

    const food = result.rows[0];

    res.status(201).json({
      food: {
        id: food.food_id,
        name: food.food_name,
        calories: parseFloat(food.calories),
        protein: food.protein ? parseFloat(food.protein) : undefined,
        carbs: food.carbs ? parseFloat(food.carbs) : undefined,
        fat: food.fat ? parseFloat(food.fat) : undefined,
      },
    });
  } catch (error) {
    console.error("Add food error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE FOOD from a meal
router.delete("/:mealId/foods/:foodRecordId", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const mealId = parseInt(req.params.mealId);
  const foodRecordId = parseInt(req.params.foodRecordId);

  try {
    // Verify meal belongs to user
    const mealCheck = await pool.query(
      "SELECT id FROM meals WHERE id = $1 AND user_id = $2",
      [mealId, userId]
    );

    if (mealCheck.rows.length === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Delete food
    await pool.query(
      "DELETE FROM meal_foods WHERE id = $1 AND meal_id = $2",
      [foodRecordId, mealId]
    );

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    console.error("Delete food error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;