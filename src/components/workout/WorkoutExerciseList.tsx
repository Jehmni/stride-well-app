import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
  instructions?: string;
  equipment_required?: string;
  difficulty?: string;
}

interface WorkoutExerciseListProps {
  exercises: Exercise[];
  className?: string;
  showAllDetails?: boolean;
}

const WorkoutExerciseList: React.FC<WorkoutExerciseListProps> = ({
  exercises,
  className,
  showAllDetails = false,
}) => {
  // Group exercises by muscle group
  const exercisesByMuscle = exercises.reduce<Record<string, Exercise[]>>((groups, exercise) => {
    const muscleGroup = exercise.muscle;
    if (!groups[muscleGroup]) {
      groups[muscleGroup] = [];
    }
    groups[muscleGroup].push(exercise);
    return groups;
  }, {});

  // Sort muscle groups for consistent ordering
  const muscleGroups = Object.keys(exercisesByMuscle).sort();

  // Get badge color by difficulty
  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800';
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showAllDetails ? (
        // Option 1: Show all exercises in one list with full details
        <Accordion type="multiple" className="w-full">
          {exercises.map(exercise => (
            <AccordionItem value={exercise.id} key={exercise.id}>
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-start text-left">
                  <Dumbbell className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                    <div>
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets} sets • {exercise.reps} • {exercise.muscle}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {exercise.difficulty && (
                      <Badge variant="outline">
                        Difficulty: {exercise.difficulty}
                      </Badge>
                    )}
                    {exercise.equipment_required && (
                      <Badge variant="outline">
                        Equipment: {exercise.equipment_required}
                      </Badge>
                    )}
                  </div>
                  
                  {exercise.instructions && (
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium text-foreground mb-1">Instructions:</h4>
                      <p>{exercise.instructions}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        // Option 2: Group by muscle and show minimal details
        <>
          {muscleGroups.map(muscleGroup => (
            <div key={muscleGroup} className="space-y-2">
              <h3 className="text-sm font-semibold">{muscleGroup}</h3>
              <ul className="space-y-2">
                {exercisesByMuscle[muscleGroup].map(exercise => (
                  <li 
                    key={exercise.id} 
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/50"
                  >
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-2 text-primary" />
                      <span>{exercise.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets} × {exercise.reps}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      
      {exercises.length === 0 && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Info className="h-5 w-5 mr-2" />
          <span>No exercises found</span>
        </div>
      )}
    </div>
  );
};

export default WorkoutExerciseList;
