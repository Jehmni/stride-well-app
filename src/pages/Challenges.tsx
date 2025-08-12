import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Target,
  Medal,
  TrendingUp,
  Zap,
  Flame,
  Star,
  Award
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-500 rounded-xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h1 
                  className="text-3xl font-bold mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Ready for a Challenge? 🏆
                </motion.h1>
                <motion.p 
                  className="text-purple-100 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Join challenges to stay motivated and compete with friends
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg px-6 py-3"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                  </motion.div>
                  Create Challenge
                </Button>
              </motion.div>
            </div>
            
            {/* Challenge Stats */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                  <div className="text-2xl font-bold">{challenges.length}</div>
                  <div className="text-sm text-purple-100">Active Challenges</div>
                </motion.div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                  <div className="text-2xl font-bold">
                    {challenges.reduce((sum, c) => sum + (c.total_participants || 0), 0)}
                  </div>
                  <div className="text-sm text-purple-100">Total Participants</div>
                </motion.div>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Star className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <div className="text-2xl font-bold">
                    {challenges.filter(c => c.completed).length}
                  </div>
                  <div className="text-sm text-purple-100">Completed</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

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
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {displayChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
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
            </motion.div>
          ))}
        </motion.div>
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
        </motion.div>
    </DashboardLayout>
  );
};

export default Challenges;
