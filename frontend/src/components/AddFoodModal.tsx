import { useState } from "react";
import type { FoodItem } from "../types";

type Props = {
  show: boolean;
  onClose: () => void;
  onAddFood: (food: FoodItem) => void;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";


export default function AddFoodModal({ show, onClose, onAddFood }: Props) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a food name to search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/foods/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch food data");
      }

      const data = await response.json();
      setSearchResults(data.foods || []);

      if (data.foods.length === 0) {
        setError("No foods found. Try a different search term.");
      }
    } catch (err) {
      setError("Error searching for foods. Please try again.");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFoodSelect = (food: FoodItem) => {
    onAddFood(food);
    // Reset state after adding
    setQuery("");
    setSearchResults([]);
    setError(null);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add Food</h2>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search for food (e.g., apple)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-gray-500 py-4">
            Searching USDA database...
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Found {searchResults.length} results. Click to add:
            </p>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((food) => (
                <li
                  key={food.id}
                  className="p-3 border rounded hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => handleFoodSelect(food)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-800">
                      {food.name}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {food.calories ? Math.round(food.calories) : "N/A"} kcal
                    </span>
                  </div>
                  {/* Optional: Show additional nutrients (show 0 values too) */}
                  {(food.protein != null || food.carbs != null || food.fat != null) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {food.protein != null ? `Protein: ${Math.round(
                        food.protein
                      )}g ` : null}
                      {food.carbs != null ? `Carbs: ${Math.round(
                        food.carbs
                      )}g ` : null}
                      {food.fat != null ? `Fat: ${Math.round(food.fat)}g` : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              onClose();
              setQuery("");
              setSearchResults([]);
              setError(null);
            }}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}