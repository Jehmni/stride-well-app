import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Plus,
  Star,
  Clock,
  ListFilter,
  RotateCcw,
  Dumbbell
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import TemplateCard from '@/components/workout/TemplateCard';
import CreateTemplateForm from '@/components/workout/CreateTemplateForm';
import { WorkoutTemplate } from '@/models/models';
import EmptyState from '@/components/ui/EmptyState';

const WorkoutTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  
  const {
    templates,
    favoriteTemplates,
    recentTemplates,
    isLoading,
    isCreating,
    createTemplate,
    deleteTemplate,
    toggleFavorite,
    startWorkoutFromTemplate
  } = useWorkoutTemplates();
  
  // Handle form submission
  const handleCreateTemplate = (data: { name: string; description?: string; useLastWorkout: boolean }) => {
    if (data.useLastWorkout) {
      // Create template from last workout
      createTemplate({
        name: data.name,
        description: data.description
      }, {
        onSuccess: () => {
          setShowCreateForm(false);
        }
      });
    } else {
      // Create empty template - future enhancement
      createTemplate({
        name: data.name,
        description: data.description,
        exercises: []
      }, {
        onSuccess: () => {
          setShowCreateForm(false);
        }
      });
    }
  };
  
  // Handle template deletion
  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
  };
  
  // Handle favorite toggling
  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    toggleFavorite({ templateId: id, isFavorite });
  };
  
  // Handle starting a workout
  const handleStartWorkout = (id: string) => {
    startWorkoutFromTemplate(id, {
      onSuccess: (result) => {
        if (result?.workoutId) {
          navigate(`/workout/${result.workoutId}`);
        }
      }
    });
  };

  return (
    <DashboardLayout title="Workout Templates">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Save and manage your favorite workouts for quick access.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>
      
      <CreateTemplateForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateTemplate}
        isSubmitting={isCreating}
        hasRecentWorkout={true}
      />
      
      {/* Quick access to recent workouts */}
      {!isLoading && recentTemplates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <RotateCcw className="h-5 w-5 mr-2 text-fitness-primary" />
            Recently Used
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTemplates.slice(0, 3).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDelete={handleDeleteTemplate}
                onToggleFavorite={handleToggleFavorite}
                onStartWorkout={handleStartWorkout}
              />
            ))}
          </div>
        </div>
      )}
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as 'all' | 'favorites')}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              <BookMarked className="h-4 w-4 mr-2" />
              All Templates
              {templates.length > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs">
                  {templates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="relative">
              <Star className="h-4 w-4 mr-2" />
              Favorites
              {favoriteTemplates.length > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs">
                  {favoriteTemplates.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="sm" className="text-gray-500" disabled>
            <ListFilter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-md" />
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={handleDeleteTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onStartWorkout={handleStartWorkout}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookMarked className="h-12 w-12 text-gray-400" />}
              title="No templates yet"
              description="Create your first workout template to get started"
              action={
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              }
            />
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-md" />
              ))}
            </div>
          ) : favoriteTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={handleDeleteTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onStartWorkout={handleStartWorkout}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star className="h-12 w-12 text-gray-400" />}
              title="No favorite templates"
              description="Mark templates as favorites for quick access"
            />
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default WorkoutTemplates; 