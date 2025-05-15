import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  PlayCircle, 
  Trash2, 
  MoreVertical, 
  Clock, 
  Dumbbell,
} from 'lucide-react';
import { WorkoutTemplate } from '@/models/models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TemplateCardProps {
  template: WorkoutTemplate;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onStartWorkout: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDelete,
  onToggleFavorite,
  onStartWorkout
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Format the last used date
  const formattedLastUsed = template.last_used_at 
    ? formatDistanceToNow(new Date(template.last_used_at), { addSuffix: true })
    : 'Never used';
    
  // Get exercise count and main muscle groups
  const exerciseCount = template.exercises?.length ?? 0;
  
  // Extract unique muscle groups (up to 3)
  const muscleGroups = template.exercises
    ?.map(ex => ex.exercise?.muscle_group)
    .filter((value, index, self) => value && self.indexOf(value) === index)
    .slice(0, 3) ?? [];

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{template.name}</CardTitle>
          <CardDescription className="text-xs mt-1 line-clamp-2">
            {template.description || 'No description'}
          </CardDescription>
        </div>
        
        {/* Favorite star */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${template.is_favorite ? 'text-yellow-500' : 'text-gray-400'}`}
          onClick={() => onToggleFavorite(template.id, !template.is_favorite)}
        >
          <Star className="h-5 w-5" fill={template.is_favorite ? 'currentColor' : 'none'} />
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 space-y-2 flex-grow">
        <div className="flex items-center text-sm text-gray-500">
          <Dumbbell className="h-4 w-4 mr-1.5 text-fitness-primary" />
          <span>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1.5 text-fitness-primary" />
          <span>
            {template.use_count > 0 
              ? `Used ${template.use_count} time${template.use_count !== 1 ? 's' : ''}, ${formattedLastUsed}`
              : 'Never used'}
          </span>
        </div>
        
        {muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {muscleGroups.map((group, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {group}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button 
          variant="default" 
          size="sm"
          className="flex-1"
          onClick={() => onStartWorkout(template.id)}
        >
          <PlayCircle className="h-4 w-4 mr-1.5" />
          Start
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleFavorite(template.id, !template.is_favorite)}>
              <Star className="h-4 w-4 mr-2" />
              {template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete(template.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TemplateCard; 