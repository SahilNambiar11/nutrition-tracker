import fetch from "node-fetch";

const API_URL = "http://localhost:8081";

interface BenchmarkResult {
  operation: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  requests: number;
}

async function benchmark(
  name: string,
  fn: () => Promise<any>,
  iterations: number = 10
): Promise<BenchmarkResult> {
  const times: number[] = [];
  
  console.log(`\nBenchmarking: ${name}`);
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await fn();
    const duration = Date.now() - start;
    times.push(duration);
    process.stdout.write(`.`);
  }
  
  console.log(` Done!`);
  
  const avgTime = times.reduce((a, b) => a + b) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    operation: name,
    avgTime: Math.round(avgTime),
    minTime,
    maxTime,
    requests: iterations,
  };
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("NUTRITION TRACKER - PERFORMANCE BENCHMARKS");
  console.log("=".repeat(60));
  
  // Create a test user and get token
  const testEmail = `test${Date.now()}@benchmark.com`;
  const testPassword = "password123";
  
  console.log("\n📝 Setting up test user...");
  
  const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  
  const { user } = await signupRes.json() as any;
  const token = user.token;
  
  console.log("✅ Test user created");
  
  // Run benchmarks
  const results: BenchmarkResult[] = [];
  
  // 1. Auth Verify
  results.push(
    await benchmark(
      "Auth - Token Verification",
      async () => {
        await fetch(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
      20
    )
  );
  
  // 2. Profile Onboarding
  results.push(
    await benchmark(
      "Profile - Complete Onboarding",
      async () => {
        await fetch(`${API_URL}/api/profile/onboarding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            age: 25,
            gender: "male",
            weightLbs: 180,
            heightInches: 70,
            activityLevel: "moderate",
            proteinPercentage: 30,
            carbsPercentage: 40,
            fatPercentage: 30,
          }),
        });
      },
      10
    )
  );
  
  // 3. Create Meal
  results.push(
    await benchmark(
      "Meals - Create Meal",
      async () => {
        await fetch(`${API_URL}/api/meals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "Benchmark Meal",
            date: "2024-01-15",
          }),
        });
      },
      15
    )
  );
  
  // 4. Get Meals
  results.push(
    await benchmark(
      "Meals - Fetch Daily Meals",
      async () => {
        await fetch(`${API_URL}/api/meals?date=2024-01-15`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
      20
    )
  );
  
  // 5. USDA Food Search
  results.push(
    await benchmark(
      "Foods - USDA API Search",
      async () => {
        await fetch(`${API_URL}/api/foods/search?q=chicken`);
      },
      10
    )
  );
  
  // 6. Add Food to Meal (first get a meal ID)
  const mealsRes = await fetch(`${API_URL}/api/meals?date=2024-01-15`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const mealsData = await mealsRes.json() as any;
  const mealId = mealsData.meals[0]?.id;
  
  if (mealId) {
    results.push(
      await benchmark(
        "Meals - Add Food to Meal",
        async () => {
          await fetch(`${API_URL}/api/meals/${mealId}/foods`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              foodId: 123456,
              foodName: "Benchmark Food",
              calories: 200,
              protein: 20,
              carbs: 30,
              fat: 5,
            }),
          });
        },
        15
      )
    );
  }
  
  // Print Results
  console.log("\n" + "=".repeat(60));
  console.log("RESULTS");
  console.log("=".repeat(60));
  console.log(
    "\nOperation".padEnd(35),
    "Avg".padStart(8),
    "Min".padStart(8),
    "Max".padStart(8)
  );
  console.log("-".repeat(60));
  
  results.forEach((result) => {
    console.log(
      result.operation.padEnd(35),
      `${result.avgTime}ms`.padStart(8),
      `${result.minTime}ms`.padStart(8),
      `${result.maxTime}ms`.padStart(8)
    );
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  const totalAvg =
    results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
  
  console.log(`\n📊 Average API Response Time: ${Math.round(totalAvg)}ms`);
  console.log(
    `⚡ Fastest Operation: ${
      results.sort((a, b) => a.avgTime - b.avgTime)[0].operation
    }`
  );
  console.log(
    `🐌 Slowest Operation: ${
      results.sort((a, b) => b.avgTime - a.avgTime)[0].operation
    }`
  );
  
  console.log("\n✅ Benchmarks complete!\n");
  
  process.exit(0);
}

// Run it
runBenchmarks().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
