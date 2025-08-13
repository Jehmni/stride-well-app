// Exercise Icon Mapping Utility
// This provides consistent exercise icons across the application

export const getExerciseIcon = (exerciseName: string) => {
  const name = exerciseName.toLowerCase();
  
  // Upper Body Exercises
  if (name.includes('push') || name.includes('press') || name.includes('chest')) {
    return '💪';
  }
  if (name.includes('pull') || name.includes('row') || name.includes('chin') || name.includes('lat')) {
    return '🔄';
  }
  if (name.includes('curl') || name.includes('bicep')) {
    return '💪';
  }
  if (name.includes('tricep') || name.includes('dip')) {
    return '🔥';
  }
  if (name.includes('shoulder') || name.includes('lateral') || name.includes('overhead')) {
    return '🏔️';
  }
  
  // Lower Body Exercises
  if (name.includes('squat') || name.includes('quad')) {
    return '🦵';
  }
  if (name.includes('lunge') || name.includes('step')) {
    return '👟';
  }
  if (name.includes('deadlift') || name.includes('hamstring')) {
    return '⚡';
  }
  if (name.includes('calf') || name.includes('raise')) {
    return '🦶';
  }
  if (name.includes('glute') || name.includes('hip')) {
    return '🍑';
  }
  
  // Core Exercises
  if (name.includes('plank') || name.includes('core')) {
    return '🎯';
  }
  if (name.includes('crunch') || name.includes('sit') || name.includes('ab')) {
    return '⚡';
  }
  if (name.includes('mountain') || name.includes('climber')) {
    return '🏔️';
  }
  
  // Cardio/Full Body
  if (name.includes('burpee') || name.includes('jump')) {
    return '🔥';
  }
  if (name.includes('run') || name.includes('sprint')) {
    return '🏃';
  }
  if (name.includes('bike') || name.includes('cycle')) {
    return '🚴';
  }
  if (name.includes('swim')) {
    return '🏊';
  }
  
  // General/Compound Movements
  if (name.includes('clean') || name.includes('snatch')) {
    return '🏋️';
  }
  if (name.includes('row') && !name.includes('dumbbell')) {
    return '🚣';
  }
  
  // Default
  return '💪';
};

// Alternative icon set using emojis for different categories
export const getExerciseCategoryIcon = (exerciseName: string) => {
  const name = exerciseName.toLowerCase();
  
  // Categorize by primary muscle group
  if (name.includes('chest') || name.includes('push') || name.includes('bench')) {
    return '🫀'; // Chest
  }
  if (name.includes('back') || name.includes('pull') || name.includes('lat')) {
    return '🔙'; // Back
  }
  if (name.includes('shoulder') || name.includes('overhead')) {
    return '🤷'; // Shoulders
  }
  if (name.includes('arm') || name.includes('bicep') || name.includes('tricep')) {
    return '💪'; // Arms
  }
  if (name.includes('leg') || name.includes('squat') || name.includes('quad') || name.includes('hamstring')) {
    return '🦵'; // Legs
  }
  if (name.includes('core') || name.includes('ab') || name.includes('plank')) {
    return '🎯'; // Core
  }
  if (name.includes('cardio') || name.includes('run') || name.includes('bike')) {
    return '❤️'; // Cardio
  }
  
  return '🏋️'; // Default strength
};

// Get exercise difficulty icon
export const getDifficultyIcon = (difficulty: string | number) => {
  if (typeof difficulty === 'string') {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return '🟢';
      case 'intermediate':
      case 'medium':
        return '🟡';
      case 'advanced':
      case 'hard':
        return '🔴';
      default:
        return '⚪';
    }
  }
  
  if (typeof difficulty === 'number') {
    if (difficulty <= 3) return '🟢';
    if (difficulty <= 6) return '🟡';
    if (difficulty <= 10) return '🔴';
  }
  
  return '⚪';
};
