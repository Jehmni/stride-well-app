import { supabase } from "@/integrations/supabase/client";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'steps' | 'workouts' | 'weight' | 'distance' | 'duration' | 'custom';
  goal_value: number;
  goal_unit: string;
  start_date: string;
  end_date: string;
  current_progress?: number;
  completed?: boolean;
  total_participants?: number;
  user_rank?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  reward_description?: string;
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  progress_value: number;
  notes?: string;
  created_at: string;
}

/**
 * Get all available challenges for a user
 */
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_challenges', {
      user_id_param: userId
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    return [];
  }
};

/**
 * Join a challenge
 */
export const joinChallenge = async (challengeId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        current_progress: 0,
        completed: false
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error joining challenge:', error);
    return false;
  }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  challengeId: string,
  userId: string,
  progressValue: number,
  notes?: string
): Promise<boolean> => {
  try {
    // Log the progress
    const { error: logError } = await supabase
      .from('challenge_progress_logs')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        progress_value: progressValue,
        notes
      });

    if (logError) throw logError;

    // Update the participant's current progress
    const { error: updateError } = await supabase
      .from('challenge_participants')
      .update({
        current_progress: progressValue
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return false;
  }
};

/**
 * Create a new challenge
 */
export const createChallenge = async (challenge: Omit<Challenge, 'id'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        challenge_type: challenge.challenge_type,
        goal_value: challenge.goal_value,
        goal_unit: challenge.goal_unit,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        difficulty_level: challenge.difficulty_level,
        reward_description: challenge.reward_description,
        is_public: true
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
};

/**
 * Get challenge leaderboard
 */
export const getChallengeLeaderboard = async (challengeId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        current_progress,
        completed,
        user_id,
        user_profiles!inner(first_name, last_name)
      `)
      .eq('challenge_id', challengeId)
      .order('current_progress', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error);
    return [];
  }
};

/**
 * Get challenge progress history for a user
 */
export const getChallengeProgressHistory = async (
  challengeId: string,
  userId: string
): Promise<ChallengeProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('challenge_progress_logs')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching challenge progress history:', error);
    return [];
  }
};

/**
 * Leave a challenge
 */
export const leaveChallenge = async (challengeId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error leaving challenge:', error);
    return false;
  }
};
