import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchWorkoutTemplates,
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  toggleFavoriteTemplate,
  startWorkoutFromTemplate,
  createTemplateFromLastWorkout
} from '@/services/templateService';
import { WorkoutTemplate } from '@/models/models';

export const useWorkoutTemplates = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch templates
  const {
    data: templates = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['workoutTemplates', user?.id],
    queryFn: () => user?.id ? fetchWorkoutTemplates(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      workoutLogId,
      workoutId,
      exercises
    }: {
      name: string;
      description?: string;
      workoutLogId?: string;
      workoutId?: string;
      exercises?: any[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      setIsCreating(true);
      
      try {
        const result = await createWorkoutTemplate(
          user.id,
          name,
          description || null,
          workoutLogId,
          workoutId,
          exercises
        );
        
        if (!result) throw new Error('Failed to create template');
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: () => {
      toast.success('Workout template saved');
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const success = await deleteWorkoutTemplate(templateId);
      if (!success) throw new Error('Failed to delete template');
      return templateId;
    },
    onSuccess: (templateId) => {
      toast.success('Template deleted');
      
      // Optimistic update
      queryClient.setQueryData(
        ['workoutTemplates', user?.id],
        (old: WorkoutTemplate[] | undefined) => old?.filter(t => t.id !== templateId) || []
      );
    },
    onError: () => {
      toast.error('Failed to delete template');
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates', user?.id] });
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ templateId, isFavorite }: { templateId: string; isFavorite: boolean }) => {
      const success = await toggleFavoriteTemplate(templateId, isFavorite);
      if (!success) throw new Error('Failed to update favorite status');
      return { templateId, isFavorite };
    },
    onSuccess: ({ templateId, isFavorite }) => {
      // Optimistic update
      queryClient.setQueryData(
        ['workoutTemplates', user?.id],
        (old: WorkoutTemplate[] | undefined) => 
          old?.map(t => t.id === templateId ? { ...t, is_favorite: isFavorite } : t) || []
      );
    },
    onError: () => {
      toast.error('Failed to update favorite status');
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates', user?.id] });
    }
  });

  // Start workout from template mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await startWorkoutFromTemplate(templateId, user.id);
      if (!result) throw new Error('Failed to start workout');
      return result;
    },
    onSuccess: (result) => {
      toast.success('Workout started from template');
      return result;
    },
    onError: () => {
      toast.error('Failed to start workout from template');
    }
  });

  // Create from last workout mutation
  const createFromLastMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      setIsCreating(true);
      
      try {
        const result = await createTemplateFromLastWorkout(user.id, name, description);
        if (!result) throw new Error('Failed to create template from last workout');
        return result;
      } finally {
        setIsCreating(false);
      }
    },
    onSuccess: () => {
      toast.success('Template created from last workout');
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Filter templates by favorite
  const favoriteTemplates = templates.filter(t => t.is_favorite);
  const recentTemplates = templates.filter(t => !t.is_favorite)
    .sort((a, b) => {
      if (!a.last_used_at && !b.last_used_at) return 0;
      if (!a.last_used_at) return 1;
      if (!b.last_used_at) return -1;
      return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime();
    })
    .slice(0, 5);

  return {
    templates,
    favoriteTemplates,
    recentTemplates,
    isLoading,
    isError,
    error,
    isCreating,
    refetch,
    createTemplate: createMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    startWorkoutFromTemplate: startWorkoutMutation.mutate,
    createFromLastWorkout: createFromLastMutation.mutate
  };
}; 