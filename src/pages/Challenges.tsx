
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Define challenge types
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'steps' | 'workouts' | 'weight' | 'distance';
  goal: number;
  progress: number;
  participants: number;
  endDate: Date;
  completed: boolean;
}

const Challenges: React.FC = () => {
  // Mock challenges data
  const [challenges] = useState<Challenge[]>([
    {
      id: '1',
      title: '10K Steps Daily',
      description: 'Complete 10,000 steps every day for 30 days',
      type: 'steps',
      goal: 300000,
      progress: 156000,
      participants: 128,
      endDate: new Date('2024-06-15'),
      completed: false
    },
    {
      id: '2',
      title: 'Weight Loss Challenge',
      description: 'Lose 5% of your body weight in 8 weeks',
      type: 'weight',
      goal: 5,
      progress: 2.5,
      participants: 87,
      endDate: new Date('2024-07-01'),
      completed: false
    },
    {
      id: '3',
      title: '20 Workouts Challenge',
      description: 'Complete 20 workouts in a month',
      type: 'workouts',
      goal: 20,
      progress: 20,
      participants: 194,
      endDate: new Date('2024-05-01'),
      completed: true
    },
    {
      id: '4',
      title: '100 Mile Club',
      description: 'Run or walk 100 miles in total',
      type: 'distance',
      goal: 100,
      progress: 42,
      participants: 56,
      endDate: new Date('2024-08-30'),
      completed: false
    }
  ]);

  const getChallengeIcon = (type: Challenge['type']) => {
    switch (type) {
      case 'steps':
        return <Users className="h-5 w-5" />;
      case 'weight':
        return <Trophy className="h-5 w-5" />;
      case 'workouts':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'distance':
        return <ArrowRight className="h-5 w-5" />;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatProgress = (challenge: Challenge) => {
    switch (challenge.type) {
      case 'steps':
        return `${challenge.progress.toLocaleString()} / ${challenge.goal.toLocaleString()} steps`;
      case 'weight':
        return `${challenge.progress}% / ${challenge.goal}%`;
      case 'workouts':
        return `${challenge.progress} / ${challenge.goal} workouts`;
      case 'distance':
        return `${challenge.progress} / ${challenge.goal} miles`;
    }
  };
  
  const getProgressPercentage = (challenge: Challenge) => {
    return (challenge.progress / challenge.goal) * 100;
  };

  return (
    <DashboardLayout title="Fitness Challenges">
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Join challenges to stay motivated and compete with friends. Complete challenges to earn badges and rewards.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {challenges.map(challenge => (
          <Card key={challenge.id} className={challenge.completed ? "border-green-500" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
                      {getChallengeIcon(challenge.type)}
                    </span>
                    {challenge.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{challenge.description}</CardDescription>
                </div>
                {challenge.completed && (
                  <Badge className="bg-green-500">Completed</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{formatProgress(challenge)}</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(getProgressPercentage(challenge))}%
                  </span>
                </div>
                <Progress value={getProgressPercentage(challenge)} className={challenge.completed ? "bg-green-100" : ""} />
                <div className="flex justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{challenge.participants} participants</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Ends {formatDate(challenge.endDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={challenge.completed}
              >
                {challenge.completed ? "Completed" : "View Details"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Challenges;
