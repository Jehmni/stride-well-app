
/**
 * Calculate BMI (Body Mass Index) using height and weight
 * @param height - Height in centimeters
 * @param weight - Weight in kilograms
 * @returns BMI value or null if height or weight is invalid
 */
export const calculateBMI = (height: number, weight: number): number | null => {
  // Validate inputs
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null;
  }
  
  // Convert height from cm to m and calculate BMI
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Get BMI category based on BMI value
 * @param bmi - BMI value
 * @returns BMI category as a string
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal Weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

/**
 * Calculate daily caloric needs based on user profile
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param sex - 'male' or 'female'
 * @param activityLevel - Activity level factor
 * @returns Estimated daily caloric needs
 */
export const calculateDailyCalories = (
  weight: number,
  height: number,
  age: number,
  sex: string,
  activityLevel: number = 1.2
): number => {
  // Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
  let bmr: number;
  
  if (sex === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Total Daily Energy Expenditure (TDEE)
  return Math.round(bmr * activityLevel);
};
