// Existing types
export type FoodItem = {
  id: number; // USDA food ID
  recordId?: number; // Database record ID for deletion
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type Meal = {
  id: number;
  name: string;
  foods: FoodItem[];
};

// New authentication types
export type User = {
  id: number;
  email: string;
  token: string; // JWT token
};

export type UserProfile = {
  id: number;
  userId: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  weightLbs: number;
  heightInches: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  maintenanceCalories: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  onboardingCompleted: boolean;
};

// For onboarding form
export type OnboardingData = {
  age: number;
  gender: 'male' | 'female' | 'other';
  weightLbs: number;
  heightInches: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
};

// API response types
export type AuthResponse = {
  user: User;
  profile?: UserProfile;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupCredentials = {
  email: string;
  password: string;
};