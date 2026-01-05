import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
};

export default function ProfileSummary({ profile }: Props) {
  const proteinGrams = Math.round(
    (profile.maintenanceCalories * profile.proteinPercentage) / 100 / 4
  );
  const carbsGrams = Math.round(
    (profile.maintenanceCalories * profile.carbsPercentage) / 100 / 4
  );
  const fatGrams = Math.round(
    (profile.maintenanceCalories * profile.fatPercentage) / 100 / 9
  );

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-2xl font-bold mb-4">Your Daily Goals</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-white bg-opacity-20 p-4 rounded">
          <p className="text-sm opacity-90">Calories</p>
          <p className="text-3xl font-bold">{profile.maintenanceCalories}</p>
          <p className="text-xs opacity-75">kcal</p>
        </div>

        {/* Protein */}
        <div className="bg-white bg-opacity-20 p-4 rounded">
          <p className="text-sm opacity-90">Protein</p>
          <p className="text-3xl font-bold">{proteinGrams}g</p>
          <p className="text-xs opacity-75">{profile.proteinPercentage}%</p>
        </div>

        {/* Carbs */}
        <div className="bg-white bg-opacity-20 p-4 rounded">
          <p className="text-sm opacity-90">Carbs</p>
          <p className="text-3xl font-bold">{carbsGrams}g</p>
          <p className="text-xs opacity-75">{profile.carbsPercentage}%</p>
        </div>

        {/* Fat */}
        <div className="bg-white bg-opacity-20 p-4 rounded">
          <p className="text-sm opacity-90">Fat</p>
          <p className="text-3xl font-bold">{fatGrams}g</p>
          <p className="text-xs opacity-75">{profile.fatPercentage}%</p>
        </div>
      </div>
    </div>
  );
}