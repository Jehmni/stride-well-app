import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Target,
  Medal,
  TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Challenge,
  getUserChallenges,
  joinChallenge,
  leaveChallenge,
  updateChallengeProgress,
  getChallengeLeaderboard
} from "@/services/challengeService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Challenges: React.FC = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [progressValue, setProgressValue] = useState<string>("");

  // Form state for creating challenges
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    challenge_type: "workouts" as Challenge['challenge_type'],
    goal_value: 0,
    goal_unit: "workouts",
    duration_days: 30,
    difficulty_level: "beginner" as Challenge['difficulty_level'],
    reward_description: ""
  });

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const challengesData = await getUserChallenges(user.id);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      toast.error('Please log in to join challenges');
      return;
    }

    try {
      const success = await joinChallenge(challengeId, user.id);
      if (success) {
        toast.success('Successfully joined the challenge!');
        await fetchChallenges();
      } else {
        toast.error('Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      const success = await leaveChallenge(challengeId, user.id);
      if (success) {
        toast.success('Left the challenge');
        await fetchChallenges();
      } else {
        toast.error('Failed to leave challenge');
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast.error('Failed to leave challenge');
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedChallenge || !user || !progressValue) return;

    try {
      const progress = parseFloat(progressValue);
      const success = await updateChallengeProgress(
        selectedChallenge.id,
        user.id,
        progress
      );

      if (success) {
        toast.success('Progress updated successfully!');
        setProgressValue("");
        setSelectedChallenge(null);
        await fetchChallenges();
      } else {
        toast.error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    return `${diffDays} days left`;
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getTypeIcon = (type: Challenge['challenge_type']) => {
    switch (type) {
      case 'steps': return '👟';
      case 'workouts': return '💪';
      case 'weight': return '⚖️';
      case 'distance': return '🏃';
      case 'duration': return '⏱️';
      default: return '🎯';
    }
  };
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // Use real challenges data from database
  const displayChallenges = challenges;

  return (
    <DashboardLayout title="Fitness Challenges">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Join challenges to stay motivated and compete with friends.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayChallenges.map((challenge) => (
            <Card key={challenge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(challenge.challenge_type)}</span>
                    <div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      {challenge.difficulty_level && (
                        <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty_level)}`}>
                          {challenge.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {challenge.completed && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {challenge.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {challenge.current_progress || 0} / {challenge.goal_value} {challenge.goal_unit}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(challenge.current_progress || 0, challenge.goal_value)} 
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500">
                    {Math.round(getProgressPercentage(challenge.current_progress || 0, challenge.goal_value))}% complete
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{challenge.total_participants || 0} participants</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{formatEndDate(challenge.end_date)}</span>
                  </div>
                </div>

                {challenge.user_rank && (
                  <div className="flex items-center space-x-1 text-sm">
                    <Medal className="h-4 w-4 text-yellow-500" />
                    <span>Rank #{challenge.user_rank}</span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex space-x-2">
                {challenge.current_progress !== undefined ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Update Progress
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleLeaveChallenge(challenge.id)}
                    >
                      Leave
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleJoinChallenge(challenge.id)}
                    disabled={challenge.completed}
                  >
                    {challenge.completed ? 'Ended' : 'Join Challenge'}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Update your progress for "{selectedChallenge?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress">Current Progress ({selectedChallenge?.goal_unit})</Label>
              <Input
                id="progress"
                type="number"
                placeholder={`Enter your progress in ${selectedChallenge?.goal_unit}`}
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChallenge(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProgress}>
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Create a custom challenge for yourself and others to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                placeholder="e.g., 30-Day Plank Challenge"
                value={newChallenge.title}
                onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge..."
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newChallenge.challenge_type}
                  onValueChange={(value: Challenge['challenge_type']) => 
                    setNewChallenge({...newChallenge, challenge_type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workouts">Workouts</SelectItem>
                    <SelectItem value="steps">Steps</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={newChallenge.difficulty_level}
                  onValueChange={(value: Challenge['difficulty_level']) => 
                    setNewChallenge({...newChallenge, difficulty_level: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal">Goal Value</Label>
                <Input
                  id="goal"
                  type="number"
                  placeholder="e.g., 20"
                  value={newChallenge.goal_value || ''}
                  onChange={(e) => setNewChallenge({...newChallenge, goal_value: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 30"
                  value={newChallenge.duration_days}
                  onChange={(e) => setNewChallenge({...newChallenge, duration_days: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle challenge creation
              toast.success('Challenge creation feature coming soon!');
              setShowCreateDialog(false);
            }}>
              Create Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Challenges;
