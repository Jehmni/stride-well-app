
import React from "react";
import { Activity, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";
import { UserProfile } from "@/models/models";

interface ProfileHeaderProps {
  profile: UserProfile | null;
  email: string | null | undefined;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, email }) => {
  // Calculate BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  const bmiCategory = userBMI ? getBMICategory(userBMI) : null;
  
  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Welcome';
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
      <UserAvatar size="lg" showUploadButton={true} />
      <div>
        <h2 className="text-2xl font-bold mb-1">{getDisplayName()}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{email}</p>
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Activity className="h-4 w-4 mr-1" />
          <span>
            {profile?.fitness_goal === "weight-loss" ? "Weight Loss" : 
            profile?.fitness_goal === "muscle-gain" ? "Muscle Gain" : 
            profile?.fitness_goal === "endurance" ? "Endurance" : 
            "General Fitness"} Goal
          </span>
        </div>
        {userBMI && (
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="h-4 w-4 mr-1" />
            <span>BMI: {userBMI.toFixed(1)} ({bmiCategory})</span>
          </div>
        )}
      </div>
      <div className="md:ml-auto mt-4 md:mt-0">
        <Button variant="outline" className="flex items-center">
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </div>
    </div>
  );
};

export default ProfileHeader;
