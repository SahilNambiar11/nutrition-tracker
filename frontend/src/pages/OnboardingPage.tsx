import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
console.log("API URL is:", API_URL);


export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: "",
    gender: "male" as "male" | "female" | "other",
    weightLbs: "",
    heightInches: "",
    activityLevel: "moderate" as any,
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatPercentage: 30,
  });
  const [maintenanceCalories, setMaintenanceCalories] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMacroChange = (macro: string, value: number) => {
    const newValue = Math.max(0, Math.min(100, value));
    setFormData((prev) => ({
      ...prev,
      [macro]: newValue,
    }));
  };

  const calculatePreview = () => {
    const { age, gender, weightLbs, heightInches, activityLevel } = formData;
    if (!age || !weightLbs || !heightInches) return;

    // Basic TDEE calculation (client-side preview)
    const weightKg = parseFloat(weightLbs) * 0.453592;
    const heightCm = parseFloat(heightInches) * 2.54;
    const ageNum = parseInt(age);

    let bmr;
    if (gender === "male") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    } else if (gender === "female") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 78;
    }

    const multipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = Math.round(bmr * multipliers[activityLevel]);
    setMaintenanceCalories(tdee);
  };

  const handleStep1Submit = () => {
    if (!formData.age || !formData.weightLbs || !formData.heightInches) {
      setError("Please fill in all fields");
      return;
    }
    calculatePreview();
    setError("");
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    const total =
      formData.proteinPercentage +
      formData.carbsPercentage +
      formData.fatPercentage;

    if (total !== 100) {
      setError("Macro percentages must add up to 100%");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/profile/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          weightLbs: parseFloat(formData.weightLbs),
          heightInches: parseFloat(formData.heightInches),
          activityLevel: formData.activityLevel,
          proteinPercentage: formData.proteinPercentage,
          carbsPercentage: formData.carbsPercentage,
          fatPercentage: formData.fatPercentage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save profile");
      }

      const data = await response.json();
      updateProfile(data.profile);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const macroGrams = {
    protein: Math.round((maintenanceCalories * formData.proteinPercentage) / 100 / 4),
    carbs: Math.round((maintenanceCalories * formData.carbsPercentage) / 100 / 4),
    fat: Math.round((maintenanceCalories * formData.fatPercentage) / 100 / 9),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-6">
          Let's set up your profile to calculate your nutritional needs.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  value={formData.weightLbs}
                  onChange={(e) => handleInputChange("weightLbs", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Height (inches)</label>
                <input
                  type="number"
                  value={formData.heightInches}
                  onChange={(e) =>
                    handleInputChange("heightInches", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => handleInputChange("activityLevel", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (physical job)</option>
              </select>
            </div>

            <button
              onClick={handleStep1Submit}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next: Customize Macros
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Your Maintenance Calories
            </h2>

            <div className="bg-green-100 p-6 rounded-lg mb-6 text-center">
              <p className="text-gray-700 mb-2">Daily Calorie Target</p>
              <p className="text-4xl font-bold text-green-700">
                {maintenanceCalories} kcal
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-3">
              Customize Your Macro Split
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Adjust the percentages below (must total 100%)
            </p>

            <div className="space-y-4 mb-6">
              {/* Protein */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Protein</span>
                  <span>
                    {formData.proteinPercentage}% ({macroGrams.protein}g)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={formData.proteinPercentage}
                  onChange={(e) =>
                    handleMacroChange("proteinPercentage", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Carbohydrates</span>
                  <span>
                    {formData.carbsPercentage}% ({macroGrams.carbs}g)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={formData.carbsPercentage}
                  onChange={(e) =>
                    handleMacroChange("carbsPercentage", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Fat */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Fat</span>
                  <span>
                    {formData.fatPercentage}% ({macroGrams.fat}g)
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={formData.fatPercentage}
                  onChange={(e) =>
                    handleMacroChange("fatPercentage", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span
                    className={
                      formData.proteinPercentage +
                        formData.carbsPercentage +
                        formData.fatPercentage ===
                      100
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formData.proteinPercentage +
                      formData.carbsPercentage +
                      formData.fatPercentage}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}