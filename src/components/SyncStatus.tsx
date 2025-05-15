import React, { useState } from 'react';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Upload, 
  AlertTriangle,
  Server,
  Merge,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SyncStatus: React.FC = () => {
  const {
    isOnline,
    pendingWorkouts,
    syncWorkouts,
    isLoading,
    getOfflineWorkouts,
    conflicts,
    resolveConflict,
    hasFailedSyncs
  } = useWorkoutTracking();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'conflicts'>('pending');
  
  // Get offline workouts when dialog opens
  const offlineWorkouts = getOfflineWorkouts().filter(w => !w.synced);
  
  // Handle sync button click
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('You need to be online to sync workouts');
      return;
    }
    
    const count = await syncWorkouts();
    if (count === 0 && pendingWorkouts === 0) {
      setIsDialogOpen(false);
    }
  };
  
  // Format workout date
  const formatWorkoutDate = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };
  
  // Resolve a conflict
  const handleResolveConflict = async (id: string, resolution: 'local' | 'server' | 'merged') => {
    const success = await resolveConflict(id, resolution);
    
    if (success) {
      toast.success(`Conflict resolved using ${resolution} data`);
    } else {
      toast.error('Failed to resolve conflict');
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isOnline ? 'outline' : 'secondary'} 
              size="sm"
              className="relative"
              onClick={() => setIsDialogOpen(true)}
            >
              {isOnline ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
              {pendingWorkouts > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-[10px] px-1"
                >
                  {pendingWorkouts}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isOnline ? 'Online' : 'Offline'} 
              {pendingWorkouts > 0 ? ` • ${pendingWorkouts} workout${pendingWorkouts === 1 ? '' : 's'} pending sync` : ''}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOnline ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
              Workout Sync Status
            </DialogTitle>
            <DialogDescription>
              {isOnline 
                ? 'Manage workouts waiting to be synced to the cloud' 
                : 'You are currently offline. Workouts will sync when you reconnect.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? 'outline' : 'secondary'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                {pendingWorkouts > 0 && (
                  <Badge variant="destructive">
                    {pendingWorkouts} Pending
                  </Badge>
                )}
                {hasFailedSyncs && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Sync Issues
                  </Badge>
                )}
                {conflicts.length > 0 && (
                  <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600">
                    {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                disabled={!isOnline || (pendingWorkouts === 0 && conflicts.length === 0)}
                onClick={handleSync}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>
            
            <Tabs 
              defaultValue="pending" 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as 'pending' | 'conflicts')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="pending"
                  disabled={pendingWorkouts === 0}
                  className="relative"
                >
                  Pending Workouts
                  {pendingWorkouts > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
                      {pendingWorkouts}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="conflicts"
                  disabled={conflicts.length === 0}
                  className="relative"
                >
                  Conflicts
                  {conflicts.length > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center text-[10px] px-1 bg-yellow-500">
                      {conflicts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-4">
                {offlineWorkouts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2 opacity-50" />
                    <p>No pending workouts to sync</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {offlineWorkouts.map((workout) => (
                      <Card key={workout.id} className={workout.syncError ? 'border-red-300' : 'border-gray-200'}>
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <span>{workout.title || 'Unnamed Workout'}</span>
                            {workout.syncError && (
                              <Badge variant="destructive" className="text-[10px]">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sync Failed
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatWorkoutDate(workout.timestamp)}</span>
                          </div>
                          <div className="text-xs flex items-center justify-between mt-1">
                            <span>
                              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                              {workout.duration ? ` • ${workout.duration}min` : ''}
                            </span>
                            {workout.syncAttempts > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {workout.syncAttempts} attempt{workout.syncAttempts !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          {workout.syncError && (
                            <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                              {workout.syncError}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="conflicts" className="mt-4">
                {conflicts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2 opacity-50" />
                    <p>No conflicts to resolve</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {conflicts.map((conflict) => (
                      <Card key={conflict.id} className="border-yellow-300">
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <span>{conflict.localWorkout.title || 'Unnamed Workout'}</span>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Conflict
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1 mb-1">
                              <Info className="h-3 w-3" />
                              <span>
                                A similar workout was found on both your device and the server. 
                                Please choose which version to keep:
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="bg-blue-50 p-2 rounded text-blue-800">
                                <p className="font-medium">Local</p>
                                <p>
                                  {format(new Date(conflict.localWorkout.timestamp), 'MMM d, h:mm a')}
                                </p>
                                <p>
                                  {conflict.localWorkout.exercises.length} exercises
                                </p>
                              </div>
                              
                              <div className="bg-purple-50 p-2 rounded text-purple-800">
                                <p className="font-medium">Server</p>
                                <p>
                                  {format(new Date(conflict.serverWorkout.completed_at), 'MMM d, h:mm a')}
                                </p>
                                <p>
                                  {conflict.serverWorkout.exercise_count || '?'} exercises
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-1 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              onClick={() => handleResolveConflict(conflict.id, 'local')}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Use Local
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              onClick={() => handleResolveConflict(conflict.id, 'server')}
                            >
                              <Server className="h-3 w-3 mr-1" />
                              Use Server
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              onClick={() => handleResolveConflict(conflict.id, 'merged')}
                            >
                              <Merge className="h-3 w-3 mr-1" />
                              Merge Both
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            
            {isOnline && pendingWorkouts > 0 && (
              <Button variant="default" size="sm" onClick={handleSync} disabled={isLoading}>
                {isLoading ? 'Syncing...' : 'Sync All'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SyncStatus; 