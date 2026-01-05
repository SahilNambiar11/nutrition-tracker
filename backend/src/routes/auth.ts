import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const router = Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const SALT_ROUNDS = 10;

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Create empty profile
    await pool.query(
      "INSERT INTO user_profiles (user_id, onboarding_completed) VALUES ($1, $2)",
      [user.id, false]
    );

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        token,
      },
      onboardingCompleted: false,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get profile
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [user.id]
    );

    const profile = profileResult.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        token,
      },
      profile: profile ? {
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
      } : null,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// VERIFY TOKEN (check if user is logged in)
router.get("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    // Get user and profile
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [decoded.userId]
    );

    const profile = profileResult.rows[0];

    res.json({
      user: {
        id: decoded.userId,
        email: decoded.email,
        token,
      },
      profile: profile ? {
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
      } : null,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;