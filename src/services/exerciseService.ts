import { supabase } from "@/integrations/supabase/client";
import { Exercise, ExerciseVariation } from "@/models/models";

/**
 * Fetch all exercises
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
};

/**
 * Fetch exercises by muscle group
 */
export const getExercisesByMuscleGroup = async (muscleGroup: string): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscle_group', muscleGroup)
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching exercises for muscle group ${muscleGroup}:`, error);
    return [];
  }
};

/**
 * Get a single exercise by ID
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching exercise ${id}:`, error);
    return null;
  }
};

/**
 * Search exercises by name
 */
export const searchExercises = async (query: string): Promise<Exercise[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error searching exercises for "${query}":`, error);
    return [];
  }
};

/**
 * Get exercise alternatives/variations for a specific exercise
 */
export const getExerciseVariations = async (exerciseId: string): Promise<ExerciseVariation[]> => {
  try {
    const { data, error } = await supabase
      .from('exercise_variations')
      .select(`
        *,
        primary_exercise:exercises!primary_exercise_id(*),
        alternative_exercise:exercises!alternative_exercise_id(*)
      `)
      .eq('primary_exercise_id', exerciseId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching variations for exercise ${exerciseId}:`, error);
    return [];
  }
};

/**
 * Add a new exercise variation/alternative
 */
export const addExerciseVariation = async (
  primaryExerciseId: string,
  alternativeExerciseId: string,
  variationType: 'equipment' | 'difficulty' | 'similar' | 'target',
  description?: string
): Promise<ExerciseVariation | null> => {
  try {
    const { data, error } = await supabase
      .from('exercise_variations')
      .insert({
        primary_exercise_id: primaryExerciseId,
        alternative_exercise_id: alternativeExerciseId,
        variation_type: variationType,
        description: description || null
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding exercise variation:', error);
    return null;
  }
};

/**
 * Delete an exercise variation
 */
export const deleteExerciseVariation = async (variationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercise_variations')
      .delete()
      .eq('id', variationId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting variation ${variationId}:`, error);
    return false;
  }
};

/**
 * Find similar exercises (by muscle group) when no direct variations exist
 */
export const findSimilarExercises = async (
  exerciseId: string,
  limit: number = 5
): Promise<Exercise[]> => {
  try {
    // First get the target exercise's details
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
      
    if (exerciseError || !exerciseData) {
      throw exerciseError || new Error('Exercise not found');
    }
    
    // Get exercises with the same muscle group
    const { data: similarExercises, error: similarError } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscle_group', exerciseData.muscle_group)
      .neq('id', exerciseId) // Exclude the original exercise
      .limit(limit);
      
    if (similarError) throw similarError;
    return similarExercises || [];
  } catch (error) {
    console.error(`Error finding similar exercises for ${exerciseId}:`, error);
    return [];
  }
};

/**
 * Find exercises that can be done with specific equipment
 */
export const findExercisesByEquipment = async (
  equipment: string,
  muscleGroup?: string,
  limit: number = 10
): Promise<Exercise[]> => {
  try {
    let query = supabase
      .from('exercises')
      .select('*')
      .ilike('equipment', `%${equipment}%`)
      .limit(limit);
      
    // If muscle group is specified, filter by it
    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error finding exercises for equipment "${equipment}":`, error);
    return [];
  }
}; 