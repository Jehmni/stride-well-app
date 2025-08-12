// Smart reminder service using AI to suggest optimal workout times and patterns

export interface UserWorkoutPattern {
  userId: string;
  preferredDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  preferredTimes: string[]; // HH:MM format
  workoutDuration: number; // minutes
  consistency: number; // 0-1, how consistent they are with workouts
  energyLevels: {
    [timeSlot: string]: number; // 0-10 energy level for different times
  };
  scheduleConstraints: {
    workDays: number[];
    workStartTime: string;
    workEndTime: string;
    familyTime: string[];
    otherCommitments: string[];
  };
  fitnessGoals: string[];
  currentFitnessLevel: string;
}

export interface SmartReminderSuggestion {
  id: string;
  suggestedTime: string;
  suggestedDays: number[];
  confidence: number; // 0-1, how confident the AI is in this suggestion
  reasoning: string;
  expectedAdherence: number; // 0-1, expected adherence rate
  alternativeTimes: string[];
  alternativeDays: number[];
}

export interface ReminderOptimizationData {
  userId: string;
  currentReminders: any[];
  workoutHistory: any[];
  userPreferences: UserWorkoutPattern;
  externalFactors: {
    weather: any;
    localEvents: any[];
    seasonalChanges: any;
  };
}

export class SmartReminderService {
  private readonly defaultEnergyLevels = {
    '06:00': 8, // Early morning - high energy
    '07:00': 9,
    '08:00': 8,
    '09:00': 7,
    '12:00': 6, // Lunch time - moderate energy
    '13:00': 5,
    '14:00': 6,
    '17:00': 7, // After work - good energy
    '18:00': 8,
    '19:00': 7,
    '20:00': 6,
    '21:00': 5, // Late evening - lower energy
  };

  private readonly fitnessGoalTimePreferences = {
    'weight-loss': ['06:00', '07:00', '18:00', '19:00'], // Morning/evening for fat burning
    'muscle-gain': ['17:00', '18:00', '19:00', '20:00'], // Afternoon/evening for strength
    'endurance': ['06:00', '07:00', '08:00', '17:00'], // Morning/afternoon for cardio
    'flexibility': ['06:00', '07:00', '20:00', '21:00'], // Morning/evening for stretching
    'general-fitness': ['07:00', '08:00', '18:00', '19:00'], // Balanced times
  };

  /**
   * Generate smart reminder suggestions based on user patterns and preferences
   */
  async generateSmartSuggestions(
    optimizationData: ReminderOptimizationData
  ): Promise<SmartReminderSuggestion[]> {
    try {
      console.log('🧠 Generating smart reminder suggestions for user:', optimizationData.userId);

      const suggestions: SmartReminderSuggestion[] = [];

      // 1. Analyze current workout patterns
      const patternAnalysis = this.analyzeWorkoutPatterns(optimizationData.workoutHistory);
      
      // 2. Consider user preferences and constraints
      const preferenceAnalysis = this.analyzeUserPreferences(optimizationData.userPreferences);
      
      // 3. Factor in external conditions
      const externalAnalysis = this.analyzeExternalFactors(optimizationData.externalFactors);
      
      // 4. Generate primary suggestion
      const primarySuggestion = this.generatePrimarySuggestion(
        patternAnalysis,
        preferenceAnalysis,
        externalAnalysis,
        optimizationData.userPreferences
      );
      
      suggestions.push(primarySuggestion);

      // 5. Generate alternative suggestions
      const alternatives = this.generateAlternativeSuggestions(
        primarySuggestion,
        patternAnalysis,
        preferenceAnalysis,
        optimizationData.userPreferences
      );
      
      suggestions.push(...alternatives);

      // 6. Sort by confidence and expected adherence
      suggestions.sort((a, b) => {
        const aScore = (a.confidence + a.expectedAdherence) / 2;
        const bScore = (b.confidence + b.expectedAdherence) / 2;
        return bScore - aScore;
      });

      console.log('✅ Generated', suggestions.length, 'smart reminder suggestions');
      return suggestions;

    } catch (error) {
      console.error('❌ Error generating smart suggestions:', error);
      return this.generateFallbackSuggestions(optimizationData.userPreferences);
    }
  }

  /**
   * Analyze workout history to find patterns
   */
  private analyzeWorkoutPatterns(workoutHistory: any[]): any {
    if (!workoutHistory || workoutHistory.length === 0) {
      return {
        mostSuccessfulDays: [1, 3, 5], // Monday, Wednesday, Friday
        mostSuccessfulTimes: ['07:00', '18:00'],
        averageDuration: 45,
        consistencyScore: 0.7,
      };
    }

    const dayCounts = new Array(7).fill(0);
    const timeCounts: { [key: string]: number } = {};
    const durations: number[] = [];
    let completedWorkouts = 0;
    let totalWorkouts = 0;

    workoutHistory.forEach(workout => {
      if (workout.completed_at) {
        const date = new Date(workout.completed_at);
        const day = date.getDay();
        const time = `${date.getHours().toString().padStart(2, '0')}:00`;
        
        dayCounts[day]++;
        timeCounts[time] = (timeCounts[time] || 0) + 1;
        
        if (workout.duration) {
          durations.push(workout.duration);
        }
        
        completedWorkouts++;
      }
      totalWorkouts++;
    });

    // Find most successful days
    const mostSuccessfulDays = dayCounts
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.day);

    // Find most successful times
    const mostSuccessfulTimes = Object.entries(timeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);

    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, dur) => sum + dur, 0) / durations.length 
      : 45;

    const consistencyScore = totalWorkouts > 0 ? completedWorkouts / totalWorkouts : 0.7;

    return {
      mostSuccessfulDays,
      mostSuccessfulTimes,
      averageDuration,
      consistencyScore,
    };
  }

  /**
   * Analyze user preferences and constraints
   */
  private analyzeUserPreferences(preferences: UserWorkoutPattern): any {
    const { scheduleConstraints, fitnessGoals, currentFitnessLevel } = preferences;
    
    // Calculate available time slots
    const availableSlots = this.calculateAvailableTimeSlots(scheduleConstraints);
    
    // Consider fitness goal preferences
    const goalTimePreferences = fitnessGoals.flatMap(goal => 
      this.fitnessGoalTimePreferences[goal as keyof typeof this.fitnessGoalTimePreferences] || []
    );

    // Filter available slots based on goal preferences
    const preferredSlots = availableSlots.filter(slot => 
      goalTimePreferences.includes(slot)
    );

    return {
      availableTimeSlots: availableSlots,
      preferredTimeSlots: preferredSlots,
      workDayConstraints: scheduleConstraints.workDays,
      familyTimeConstraints: scheduleConstraints.familyTime,
    };
  }

  /**
   * Calculate available time slots based on schedule constraints
   */
  private calculateAvailableTimeSlots(constraints: any): string[] {
    const allSlots = Object.keys(this.defaultEnergyLevels);
    const availableSlots: string[] = [];

    allSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      const isWorkDay = constraints.workDays.includes(new Date().getDay());
      
      if (isWorkDay) {
        const workStart = parseInt(constraints.workStartTime.split(':')[0]);
        const workEnd = parseInt(constraints.workEndTime.split(':')[0]);
        
        // Available if outside work hours or during lunch break
        if (hour < workStart || hour >= workEnd || (hour >= 12 && hour < 13)) {
          availableSlots.push(slot);
        }
      } else {
        // Weekend - most slots available
        availableSlots.push(slot);
      }
    });

    return availableSlots;
  }

  /**
   * Analyze external factors that might affect workout timing
   */
  private analyzeExternalFactors(externalFactors: any): any {
    // For now, return basic analysis
    // In a real implementation, this would consider:
    // - Weather conditions
    // - Local events
    // - Seasonal changes
    // - Traffic patterns
    
    return {
      weatherImpact: 'neutral',
      eventConflicts: [],
      seasonalRecommendations: this.getSeasonalRecommendations(),
    };
  }

  /**
   * Get seasonal workout time recommendations
   */
  private getSeasonalRecommendations(): any {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) { // Spring
      return {
        preferredTimes: ['06:00', '07:00', '18:00'],
        reasoning: 'Spring weather is ideal for morning and evening workouts',
      };
    } else if (month >= 5 && month <= 7) { // Summer
      return {
        preferredTimes: ['06:00', '07:00', '20:00'],
        reasoning: 'Summer heat makes early morning and late evening ideal',
      };
    } else if (month >= 8 && month <= 10) { // Fall
      return {
        preferredTimes: ['07:00', '08:00', '17:00', '18:00'],
        reasoning: 'Fall offers comfortable temperatures throughout the day',
      };
    } else { // Winter
      return {
        preferredTimes: ['12:00', '17:00', '18:00'],
        reasoning: 'Winter cold makes midday and early evening workouts preferable',
      };
    }
  }

  /**
   * Generate primary suggestion based on all analyses
   */
  private generatePrimarySuggestion(
    patternAnalysis: any,
    preferenceAnalysis: any,
    externalAnalysis: any,
    userPreferences: UserWorkoutPattern
  ): SmartReminderSuggestion {
    
    // Combine pattern analysis with user preferences
    const suggestedDays = preferenceAnalysis.availableTimeSlots.length > 0
      ? this.selectOptimalDays(patternAnalysis.mostSuccessfulDays, userPreferences.preferredDays)
      : [1, 3, 5]; // Default to Monday, Wednesday, Friday

    const suggestedTime = preferenceAnalysis.preferredTimeSlots.length > 0
      ? preferenceAnalysis.preferredTimeSlots[0]
      : patternAnalysis.mostSuccessfulTimes[0] || '07:00';

    const confidence = this.calculateConfidence(
      patternAnalysis,
      preferenceAnalysis,
      externalAnalysis
    );

    const expectedAdherence = this.calculateExpectedAdherence(
      patternAnalysis.consistencyScore,
      confidence,
      userPreferences
    );

    return {
      id: `suggestion-${Date.now()}`,
      suggestedTime,
      suggestedDays,
      confidence,
      reasoning: this.generateReasoning(
        patternAnalysis,
        preferenceAnalysis,
        externalAnalysis,
        suggestedTime,
        suggestedDays
      ),
      expectedAdherence,
      alternativeTimes: [],
      alternativeDays: [],
    };
  }

  /**
   * Generate alternative suggestions
   */
  private generateAlternativeSuggestions(
    primary: SmartReminderSuggestion,
    patternAnalysis: any,
    preferenceAnalysis: any,
    userPreferences: UserWorkoutPattern
  ): SmartReminderSuggestion[] {
    const alternatives: SmartReminderSuggestion[] = [];

    // Alternative 1: Different time, same days
    if (preferenceAnalysis.preferredTimeSlots.length > 1) {
      const altTime = preferenceAnalysis.preferredTimeSlots[1];
      alternatives.push({
        ...primary,
        id: `suggestion-${Date.now()}-alt1`,
        suggestedTime: altTime,
        confidence: primary.confidence * 0.9,
        expectedAdherence: primary.expectedAdherence * 0.95,
        reasoning: `Alternative time that fits your schedule and energy levels`,
      });
    }

    // Alternative 2: Different days, same time
    if (userPreferences.preferredDays.length > 0) {
      const altDays = userPreferences.preferredDays.slice(0, 3);
      alternatives.push({
        ...primary,
        id: `suggestion-${Date.now()}-alt2`,
        suggestedDays: altDays,
        confidence: primary.confidence * 0.85,
        expectedAdherence: primary.expectedAdherence * 0.9,
        reasoning: `Alternative days that align with your preferences`,
      });
    }

    return alternatives;
  }

  /**
   * Select optimal days combining success patterns with preferences
   */
  private selectOptimalDays(successfulDays: number[], preferredDays: number[]): number[] {
    const combined = [...new Set([...successfulDays, ...preferredDays])];
    
    // Prioritize days that appear in both lists
    const priorityDays = successfulDays.filter(day => preferredDays.includes(day));
    const secondaryDays = combined.filter(day => !priorityDays.includes(day));
    
    return [...priorityDays, ...secondaryDays].slice(0, 3);
  }

  /**
   * Calculate confidence score for the suggestion
   */
  private calculateConfidence(
    patternAnalysis: any,
    preferenceAnalysis: any,
    externalAnalysis: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Pattern analysis weight: 40%
    confidence += patternAnalysis.consistencyScore * 0.4;
    
    // Preference alignment weight: 35%
    const preferenceAlignment = preferenceAnalysis.preferredTimeSlots.length > 0 ? 0.8 : 0.3;
    confidence += preferenceAlignment * 0.35;
    
    // External factors weight: 25%
    const externalScore = externalAnalysis.weatherImpact === 'neutral' ? 0.7 : 0.5;
    confidence += externalScore * 0.25;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate expected adherence rate
   */
  private calculateExpectedAdherence(
    consistencyScore: number,
    confidence: number,
    userPreferences: UserWorkoutPattern
  ): number {
    let adherence = consistencyScore * 0.6; // Base on historical consistency
    
    // Boost based on preference alignment
    if (userPreferences.preferredDays.length > 0 && userPreferences.preferredTimes.length > 0) {
      adherence += 0.2;
    }
    
    // Boost based on confidence
    adherence += confidence * 0.2;

    return Math.min(adherence, 1.0);
  }

  /**
   * Generate human-readable reasoning for the suggestion
   */
  private generateReasoning(
    patternAnalysis: any,
    preferenceAnalysis: any,
    externalAnalysis: any,
    suggestedTime: string,
    suggestedDays: number[]
  ): string {
    const reasons: string[] = [];
    
    // Pattern-based reasoning
    if (patternAnalysis.consistencyScore > 0.7) {
      reasons.push(`Based on your consistent workout history`);
    }
    
    // Time preference reasoning
    if (preferenceAnalysis.preferredTimeSlots.includes(suggestedTime)) {
      reasons.push(`This time aligns with your preferred workout schedule`);
    }
    
    // Energy level reasoning
    const energyLevel = this.defaultEnergyLevels[suggestedTime as keyof typeof this.defaultEnergyLevels];
    if (energyLevel >= 7) {
      reasons.push(`This time typically has high energy levels for optimal performance`);
    }
    
    // Schedule constraint reasoning
    if (preferenceAnalysis.availableTimeSlots.includes(suggestedTime)) {
      reasons.push(`This time fits within your available schedule`);
    }
    
    // External factor reasoning
    if (externalAnalysis.seasonalRecommendations.preferredTimes.includes(suggestedTime)) {
      reasons.push(`This time is ideal for the current season`);
    }
    
    return reasons.join('. ') + '.';
  }

  /**
   * Generate fallback suggestions if AI analysis fails
   */
  private generateFallbackSuggestions(userPreferences: UserWorkoutPattern): SmartReminderSuggestion[] {
    const defaultSuggestion: SmartReminderSuggestion = {
      id: `fallback-${Date.now()}`,
      suggestedTime: '07:00',
      suggestedDays: [1, 3, 5], // Monday, Wednesday, Friday
      confidence: 0.6,
      reasoning: 'Default suggestion based on common workout patterns: early morning on weekdays for consistency and energy.',
      expectedAdherence: 0.7,
      alternativeTimes: ['18:00', '19:00'],
      alternativeDays: [2, 4], // Tuesday, Thursday
    };

    return [defaultSuggestion];
  }

  /**
   * Optimize existing reminders based on smart analysis
   */
  async optimizeExistingReminders(
    currentReminders: any[],
    optimizationData: ReminderOptimizationData
  ): Promise<any[]> {
    try {
      const suggestions = await this.generateSmartSuggestions(optimizationData);
      
      if (suggestions.length === 0) {
        return currentReminders;
      }

      const primarySuggestion = suggestions[0];
      const optimizedReminders = currentReminders.map(reminder => {
        // Only optimize if the reminder doesn't align with smart suggestions
        const isAligned = this.isReminderAligned(reminder, primarySuggestion);
        
        if (!isAligned) {
          return {
            ...reminder,
            suggested_optimization: {
              newTime: primarySuggestion.suggestedTime,
              newDays: primarySuggestion.suggestedDays,
              confidence: primarySuggestion.confidence,
              reasoning: primarySuggestion.reasoning,
            },
          };
        }
        
        return reminder;
      });

      return optimizedReminders;
    } catch (error) {
      console.error('❌ Error optimizing reminders:', error);
      return currentReminders;
    }
  }

  /**
   * Check if a reminder aligns with smart suggestions
   */
  private isReminderAligned(reminder: any, suggestion: SmartReminderSuggestion): boolean {
    const reminderTime = reminder.scheduled_time;
    const reminderDays = reminder.recurrence_pattern === 'weekly' ? [1, 3, 5] : [1]; // Simplified
    
    const timeAligned = reminderTime === suggestion.suggestedTime;
    const daysAligned = reminderDays.some(day => suggestion.suggestedDays.includes(day));
    
    return timeAligned && daysAligned;
  }
}

// Export singleton instance
export const smartReminderService = new SmartReminderService();
