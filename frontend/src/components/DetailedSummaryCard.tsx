import type { Meal, UserProfile } from "../types";

type Props = {
  meals: Meal[];
  profile: UserProfile | null;
};

export default function DailySummaryCard({ meals, profile }: Props) {
  // Calculate totals from meals
  const totals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((food) => {
        acc.calories += food.calories || 0;
        acc.protein += food.protein || 0;
        acc.carbs += food.carbs || 0;
        acc.fat += food.fat || 0;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate goals from profile
  const goals = profile
    ? {
        calories: profile.maintenanceCalories,
        protein: Math.round(
          (profile.maintenanceCalories * profile.proteinPercentage) / 100 / 4
        ),
        carbs: Math.round(
          (profile.maintenanceCalories * profile.carbsPercentage) / 100 / 4
        ),
        fat: Math.round(
          (profile.maintenanceCalories * profile.fatPercentage) / 100 / 9
        ),
      }
    : null;

  // Calculate percentages
  const percentages = goals
    ? {
        calories: Math.round((totals.calories / goals.calories) * 100),
        protein: Math.round((totals.protein / goals.protein) * 100),
        carbs: Math.round((totals.carbs / goals.carbs) * 100),
        fat: Math.round((totals.fat / goals.fat) * 100),
      }
    : null;

  const ProgressBar = ({
    label,
    current,
    goal,
    percentage,
    unit,
  }: {
    label: string;
    current: number;
    goal: number;
    percentage: number;
    unit: string;
  }) => {
    const color =
      percentage >= 100
        ? "bg-green-500"
        : percentage >= 75
        ? "bg-blue-500"
        : "bg-yellow-500";

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="text-gray-600">
            {Math.round(current)} / {goal} {unit} ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${color} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Today's Progress</h2>

      {!profile ? (
        <div className="text-center text-gray-500">
          Complete your profile to see daily goals
        </div>
      ) : (
        <div>
          <ProgressBar
            label="Calories"
            current={totals.calories}
            goal={goals!.calories}
            percentage={percentages!.calories}
            unit="kcal"
          />
          <ProgressBar
            label="Protein"
            current={totals.protein}
            goal={goals!.protein}
            percentage={percentages!.protein}
            unit="g"
          />
          <ProgressBar
            label="Carbs"
            current={totals.carbs}
            goal={goals!.carbs}
            percentage={percentages!.carbs}
            unit="g"
          />
          <ProgressBar
            label="Fat"
            current={totals.fat}
            goal={goals!.fat}
            percentage={percentages!.fat}
            unit="g"
          />

          {/* Remaining calories */}
          <div className="mt-6 p-4 bg-gray-100 rounded text-center">
            <p className="text-gray-600 mb-1">Remaining Calories</p>
            <p
              className={`text-3xl font-bold ${
                goals!.calories - totals.calories >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {Math.round(goals!.calories - totals.calories)} kcal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}