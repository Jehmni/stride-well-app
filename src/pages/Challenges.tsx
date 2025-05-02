
import React, { useState } from "react";
import { Loader2, Trophy, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

// Challenge types
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string; 
  start_date: string;
  end_date: string;
  created_by: string;
  participants: number;
  progress: number;
}

const ChallengesList: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "1",
      title: "30-Day Running Challenge",
      description: "Run at least 2 miles every day for 30 days",
      type: "cardio",
      start_date: "2025-05-01",
      end_date: "2025-05-30",
      created_by: "John Doe",
      participants: 15,
      progress: 10
    },
    {
      id: "2",
      title: "Weekly Push-up Challenge",
      description: "100 push-ups every day for a week",
      type: "strength",
      start_date: "2025-05-05",
      end_date: "2025-05-12",
      created_by: "Jane Smith",
      participants: 8,
      progress: 50
    },
  ]);

  // Challenge card component
  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{challenge.title}</CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
          <Avatar className="bg-primary">
            <AvatarFallback>
              <Trophy className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{challenge.progress}%</span>
          </div>
          <Progress value={challenge.progress} className="h-2" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{challenge.participants} participants</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="default" className="w-full">Join Challenge</Button>
      </CardFooter>
    </Card>
  );

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No Challenges Available</h3>
        <p className="mt-2 text-gray-500">Check back soon for new fitness challenges.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {challenges.map(challenge => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
};

const MyChallenges: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  // Simulated empty state for now
  return (
    <div className="text-center py-12">
      <Trophy className="h-12 w-12 mx-auto text-gray-400" />
      <h3 className="mt-4 text-lg font-medium">You Haven't Joined Any Challenges Yet</h3>
      <p className="mt-2 text-gray-500">Join a challenge to track your progress and compete with friends.</p>
      <Button className="mt-4">Browse Challenges</Button>
    </div>
  );
};

const CreateChallenge: React.FC = () => {
  // This would contain a form to create new challenges
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Create a New Challenge</h3>
      <p className="text-gray-500 mb-4">This feature is coming soon! Check back for updates.</p>
    </div>
  );
};

const Challenges: React.FC = () => {
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <DashboardLayout title="Fitness Challenges">
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Participate in fitness challenges with friends and the community to stay motivated.
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse">Browse Challenges</TabsTrigger>
            <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
            <TabsTrigger value="create">Create Challenge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse">
            <ChallengesList />
          </TabsContent>
          
          <TabsContent value="my-challenges">
            <MyChallenges />
          </TabsContent>
          
          <TabsContent value="create">
            <CreateChallenge />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Challenges;
