import express from "express";
import cors from "cors";
import foodsRouter from "./routes/foods";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import mealsRouter from "./routes/meals";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/foods", foodsRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/meals", mealsRouter);

// Test root
app.get("/", (_req, res) => {
  res.send("NUTRITION TRACKER API IS RUNNING");
});

export default app;