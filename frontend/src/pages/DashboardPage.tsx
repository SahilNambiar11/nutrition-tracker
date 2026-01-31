import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Meal, FoodItem } from "../types";

import Header from "../components/Header";
import MealCard from "../components/MealCard";
import AddMealModal from "../components/AddMealModal";
import AddFoodModal from "../components/AddFoodModal";
import DailySummaryCard from "../components/DetailedSummaryCard";

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8081' 
  : 'https://nutrition-tracker-j8uh.onrender.com';
console.log("API URL is:", API_URL);

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showMealModal, setShowMealModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [currentMealId, setCurrentMealId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch meals when date changes
  useEffect(() => {
    fetchMeals();
  }, [currentDate]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(null);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccessMessage(null);
  };

  const fetchMeals = async () => {
    if (!user?.token) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/meals?date=${currentDate}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch meals");
      }

      const data = await response.json();
      setMeals(data.meals || []);
    } catch (err: any) {
      showError(err.message || "Error loading meals");
      console.error("Error fetching meals:", err);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (name: string) => {
    if (!user?.token) return;

    try {
      const response = await fetch(`${API_URL}/api/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, date: currentDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to add meal");
      }

      await fetchMeals();
      setShowMealModal(false);
      showSuccess("Meal added successfully!");
    } catch (err: any) {
      showError(err.message || "Error adding meal");
      console.error("Error adding meal:", err);
    }
  };

  const deleteMeal = async (mealId: number) => {
    if (!user?.token) return;
    
    if (!confirm("Are you sure you want to delete this meal?")) return;

    try {
      const response = await fetch(`${API_URL}/api/meals/${mealId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal");
      }

      await fetchMeals();
      showSuccess("Meal deleted successfully!");
    } catch (err: any) {
      showError(err.message || "Error deleting meal");
      console.error("Error deleting meal:", err);
    }
  };

  const openFoodModal = (mealId: number) => {
    setCurrentMealId(mealId);
    setShowFoodModal(true);
  };

  const addFoodToMeal = async (food: FoodItem) => {
    if (!user?.token || currentMealId === null) return;

    try {
      const response = await fetch(
        `${API_URL}/api/meals/${currentMealId}/foods`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            foodId: food.id,
            foodName: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add food");
      }

      await fetchMeals();
      setShowFoodModal(false);
      showSuccess("Food added successfully!");
    } catch (err: any) {
      showError(err.message || "Error adding food");
      console.error("Error adding food:", err);
    }
  };

  const deleteFood = async (mealId: number, foodRecordId: number) => {
    if (!user?.token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/meals/${mealId}/foods/${foodRecordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete food");
      }

      await fetchMeals();
      showSuccess("Food removed successfully!");
    } catch (err: any) {
      showError(err.message || "Error deleting food");
      console.error("Error deleting food:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Date Picker */}
      <div className="mb-4 flex items-center gap-4">
        <label className="font-semibold text-gray-700">Select Date:</label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Meal Button */}
      <button
        onClick={() => setShowMealModal(true)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        + Add Meal
      </button>

      {/* Modals */}
      <AddMealModal
        show={showMealModal}
        onClose={() => setShowMealModal(false)}
        onAdd={addMeal}
      />

      <AddFoodModal
        show={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        onAddFood={addFoodToMeal}
      />

      {/* Meals List */}
      {meals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">No meals yet for this date</p>
          <p className="text-gray-500 text-sm">Click "Add Meal" to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFood={openFoodModal}
              onDelete={deleteMeal}
              onDeleteFood={(mealId, foodIndex) => {
                const mealData = meals.find(m => m.id === mealId);
                if (mealData && mealData.foods[foodIndex]?.recordId) {
                  deleteFood(mealId, mealData.foods[foodIndex].recordId!);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Daily Summary Card */}
      <DailySummaryCard meals={meals} profile={profile} />
    </div>
  );
}