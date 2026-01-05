import type { Meal } from "../types";

type Props = {
  meal: Meal;
  onAddFood: (mealId: number) => void;
  onDelete: (mealId: number) => void;
  onDeleteFood: (mealId: number, foodIndex: number) => void; // new
};

export default function MealCard({ meal, onAddFood, onDelete, onDeleteFood }: Props) {
  return (
    <div className="p-4 bg-white rounded shadow flex justify-between items-start">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">{meal.name}</h2>
          <button
            onClick={() => onDelete(meal.id)}
            className="text-red-500 font-bold text-xl hover:text-red-700"
          >
            ×
          </button>
        </div>

        <ul className="mt-2 list-disc list-inside">
          {meal.foods.map((food, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span>
                {food.name} - {food.calories} kcal
              </span>
              <button
                onClick={() => onDeleteFood(meal.id, idx)}
                className="text-red-500 ml-2 hover:text-red-700 font-bold"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onAddFood(meal.id)}
          className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Food
        </button>
      </div>
    </div>
  );
}
