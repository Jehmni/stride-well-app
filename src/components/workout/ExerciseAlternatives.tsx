import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseVariation } from '@/models/models';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shuffle, 
  Dumbbell,
  ArrowUpDown,
  Target,
  RotateCcw,
  Shield,
  ChevronRight,
  Search,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { getExerciseVariations, findSimilarExercises, searchExercises } from '@/services/exerciseService';

interface ExerciseAlternativesProps {
  exercise: Exercise;
  onSwapExercise: (oldExerciseId: string, newExercise: Exercise) => void;
}

const ExerciseAlternatives: React.FC<ExerciseAlternativesProps> = ({ 
  exercise,
  onSwapExercise
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [variations, setVariations] = useState<ExerciseVariation[]>([]);
  const [similarExercises, setSimilarExercises] = useState<Exercise[]>([]);
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (exercise && isDialogOpen) {
      fetchAlternatives();
    }
  }, [exercise, isDialogOpen]);

  const fetchAlternatives = async () => {
    setIsLoading(true);
    try {
      // Get direct variations
      const variationsData = await getExerciseVariations(exercise.id);
      setVariations(variationsData);
      
      // Get similar exercises when no variations exist
      if (variationsData.length === 0) {
        const similarData = await findSimilarExercises(exercise.id, 8);
        setSimilarExercises(similarData);
      }
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchExercises(searchQuery);
      // Filter out the current exercise
      setSearchResults(results.filter(ex => ex.id !== exercise.id));
    } catch (error) {
      console.error('Error searching exercises:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSwapExercise = (newExercise: Exercise) => {
    onSwapExercise(exercise.id, newExercise);
    setIsDialogOpen(false);
  };

  // Group variations by type
  const equipmentVariations = variations.filter(v => v.variation_type === 'equipment');
  const difficultyVariations = variations.filter(v => v.variation_type === 'difficulty');
  const targetVariations = variations.filter(v => v.variation_type === 'target');
  const similarVariations = variations.filter(v => v.variation_type === 'similar');

  // Categories label map
  const categoryIcons = {
    equipment: <Dumbbell className="h-4 w-4" />,
    difficulty: <ArrowUpDown className="h-4 w-4" />,
    target: <Target className="h-4 w-4" />,
    similar: <Shuffle className="h-4 w-4" />
  };

  const renderExerciseCard = (ex: Exercise, subtitle?: string) => (
    <Card 
      key={ex.id} 
      className="mb-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => handleSwapExercise(ex)}
    >
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm">{ex.name}</CardTitle>
        {subtitle && (
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex space-x-2 mb-0">
          <Badge variant="outline" className="text-xs">
            {ex.muscle_group}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {ex.difficulty}
          </Badge>
          {ex.equipment_required && (
            <Badge variant="outline" className="text-xs">
              {ex.equipment_required}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="ml-auto text-xs"
        >
          <Shuffle className="h-3 w-3 mr-1" />
          Alternatives
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shuffle className="h-5 w-5 mr-2" />
            Exercise Alternatives
          </DialogTitle>
          <DialogDescription>
            Find alternative exercises that target similar muscle groups
          </DialogDescription>
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-fitness-primary" />
              <div>
                <p className="font-medium">{exercise.name}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {exercise.muscle_group}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {exercise.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="direct" className="text-xs">
                Direct Alternatives
              </TabsTrigger>
              <TabsTrigger value="similar" className="text-xs">
                Similar Exercises
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs">
                Search
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : variations.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  {equipmentVariations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        {categoryIcons.equipment}
                        <span className="ml-2">Equipment Alternatives</span>
                      </h3>
                      {equipmentVariations.map(variation => 
                        renderExerciseCard(
                          variation.alternative_exercise!, 
                          variation.description || undefined
                        )
                      )}
                    </div>
                  )}
                  
                  {difficultyVariations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        {categoryIcons.difficulty}
                        <span className="ml-2">Difficulty Variations</span>
                      </h3>
                      {difficultyVariations.map(variation => 
                        renderExerciseCard(
                          variation.alternative_exercise!, 
                          variation.description || undefined
                        )
                      )}
                    </div>
                  )}
                  
                  {targetVariations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        {categoryIcons.target}
                        <span className="ml-2">Target Variations</span>
                      </h3>
                      {targetVariations.map(variation => 
                        renderExerciseCard(
                          variation.alternative_exercise!, 
                          variation.description || undefined
                        )
                      )}
                    </div>
                  )}
                  
                  {similarVariations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        {categoryIcons.similar}
                        <span className="ml-2">Similar Exercises</span>
                      </h3>
                      {similarVariations.map(variation => 
                        renderExerciseCard(
                          variation.alternative_exercise!, 
                          variation.description || undefined
                        )
                      )}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No direct alternatives found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try similar exercises or search for alternatives
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab('similar')}
                  >
                    <ChevronRight className="h-4 w-4 mr-1" />
                    View Similar Exercises
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="similar" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : similarExercises.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      <span>Same Muscle Group</span>
                    </h3>
                    {similarExercises.map(ex => renderExerciseCard(ex))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No similar exercises found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try searching for alternatives
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab('search')}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Search Exercises
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="search" className="mt-4">
              <div className="mb-4 flex">
                <Input
                  placeholder="Search for exercises..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="mr-2"
                />
                <Button 
                  onClick={handleSearch}
                  variant="secondary"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isSearching ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="h-[360px] pr-4">
                  {searchResults.map(ex => renderExerciseCard(ex))}
                </ScrollArea>
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No results found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Try another search term
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Search for exercises</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Type a name or keyword to find exercises
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseAlternatives; 