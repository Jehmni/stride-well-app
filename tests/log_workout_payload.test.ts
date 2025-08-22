import { describe, it, expect } from 'vitest';
import { LogWorkoutWithExercisesParams } from '../src/types/rpc';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

describe('log_workout_with_exercises payload', () => {
  it('validates exercise ids are UUIDs and payload shape', () => {
    const payload: LogWorkoutWithExercisesParams = {
      workout_id_param: uuidv4(),
      user_id_param: uuidv4(),
      duration_param: 30,
      calories_param: 200,
      exercise_data_param: [
        {
          exercise_id: uuidv4(),
          sets_completed: 3,
          reps_completed: 8,
          weight_used: 20,
          notes: 'Test'
        }
      ],
      is_ai_workout_param: true,
      ai_workout_plan_id_param: uuidv4()
    };

    // Basic shape checks
    expect(typeof payload.workout_id_param).toBe('string');
    expect(Array.isArray(payload.exercise_data_param)).toBe(true);
    expect(payload.exercise_data_param.length).toBeGreaterThan(0);

    // Validate IDs are proper UUIDs
    expect(validateUuid(payload.workout_id_param)).toBe(true);
    expect(validateUuid(payload.user_id_param)).toBe(true);
    for (const ex of payload.exercise_data_param) {
      expect(validateUuid(ex.exercise_id)).toBe(true);
    }
  });
});