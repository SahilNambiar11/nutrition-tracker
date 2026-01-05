import { Router } from "express";
import { Pool } from "pg";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function: Calculate TDEE using Mifflin-St Jeor Equation
function calculateTDEE(
  gender: string,
  weightLbs: number,
  heightInches: number,
  age: number,
  activityLevel: string
): number {
  // Convert to metric
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  // Calculate BMR (Basal Metabolic Rate)
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Average for 'other'
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Hard exercise 6-7 days/week
    very_active: 1.9, // Very hard exercise, physical job
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2;

  // TDEE = BMR × Activity Multiplier
  return Math.round(bmr * multiplier);
}

// COMPLETE ONBOARDING (save profile data)
router.post("/onboarding", authMiddleware, async (req, res) => {
  const userId = req.userId; // Set by authMiddleware
  const {
    age,
    gender,
    weightLbs,
    heightInches,
    activityLevel,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
  } = req.body;

  // Validation
  if (!age || !gender || !weightLbs || !heightInches || !activityLevel) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (proteinPercentage + carbsPercentage + fatPercentage !== 100) {
    return res.status(400).json({ error: "Macro percentages must add up to 100" });
  }

  try {
    // Calculate maintenance calories
    const maintenanceCalories = calculateTDEE(
      gender,
      weightLbs,
      heightInches,
      age,
      activityLevel
    );

    // Update profile
    const result = await pool.query(
      `UPDATE user_profiles 
       SET age = $1, gender = $2, weight_lbs = $3, height_inches = $4, 
           activity_level = $5, maintenance_calories = $6,
           protein_percentage = $7, carbs_percentage = $8, fat_percentage = $9,
           onboarding_completed = $10, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $11
       RETURNING *`,
      [
        age,
        gender,
        weightLbs,
        heightInches,
        activityLevel,
        maintenanceCalories,
        proteinPercentage,
        carbsPercentage,
        fatPercentage,
        true,
        userId,
      ]
    );

    const profile = result.rows[0];

    res.json({
      profile: {
        id: profile.id,
        userId: profile.user_id,
        age: profile.age,
        gender: profile.gender,
        weightLbs: parseFloat(profile.weight_lbs),
        heightInches: parseFloat(profile.height_inches),
        activityLevel: profile.activity_level,
        maintenanceCalories: profile.maintenance_calories,
        proteinPercentage: profile.protein_percentage,
        carbsPercentage: profile.carbs_percentage,
        fatPercentage: profile.fat_percentage,
        onboardingCompleted: profile.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET PROFILE
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = result.rows[0];

    res.json({
      profile: {
        id: profile.id,
        userId: profile.user_id,
        age: profile.age,
        gender: profile.gender,
        weightLbs: parseFloat(profile.weight_lbs),
        heightInches: parseFloat(profile.height_inches),
        activityLevel: profile.activity_level,
        maintenanceCalories: profile.maintenance_calories,
        proteinPercentage: profile.protein_percentage,
        carbsPercentage: profile.carbs_percentage,
        fatPercentage: profile.fat_percentage,
        onboardingCompleted: profile.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE PROFILE (change settings)
router.put("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const {
    age,
    gender,
    weightLbs,
    heightInches,
    activityLevel,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
  } = req.body;

  try {
    // Recalculate TDEE if physical stats changed
    let maintenanceCalories: number | undefined;
    if (age && gender && weightLbs && heightInches && activityLevel) {
      maintenanceCalories = calculateTDEE(
        gender,
        weightLbs,
        heightInches,
        age,
        activityLevel
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (age !== undefined) {
      updates.push(`age = $${paramIndex++}`);
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(gender);
    }
    if (weightLbs !== undefined) {
      updates.push(`weight_lbs = $${paramIndex++}`);
      values.push(weightLbs);
    }
    if (heightInches !== undefined) {
      updates.push(`height_inches = $${paramIndex++}`);
      values.push(heightInches);
    }
    if (activityLevel !== undefined) {
      updates.push(`activity_level = $${paramIndex++}`);
      values.push(activityLevel);
    }
    if (maintenanceCalories !== undefined) {
      updates.push(`maintenance_calories = $${paramIndex++}`);
      values.push(maintenanceCalories);
    }
    if (proteinPercentage !== undefined) {
      updates.push(`protein_percentage = $${paramIndex++}`);
      values.push(proteinPercentage);
    }
    if (carbsPercentage !== undefined) {
      updates.push(`carbs_percentage = $${paramIndex++}`);
      values.push(carbsPercentage);
    }
    if (fatPercentage !== undefined) {
      updates.push(`fat_percentage = $${paramIndex++}`);
      values.push(fatPercentage);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE user_profiles 
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const profile = result.rows[0];

    res.json({
      profile: {
        id: profile.id,
        userId: profile.user_id,
        age: profile.age,
        gender: profile.gender,
        weightLbs: parseFloat(profile.weight_lbs),
        heightInches: parseFloat(profile.height_inches),
        activityLevel: profile.activity_level,
        maintenanceCalories: profile.maintenance_calories,
        proteinPercentage: profile.protein_percentage,
        carbsPercentage: profile.carbs_percentage,
        fatPercentage: profile.fat_percentage,
        onboardingCompleted: profile.onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;