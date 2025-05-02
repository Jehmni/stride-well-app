
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  content: Record<string, any>;
  is_public: boolean;
  created_at: string;
  profile?: UserProfile;
}

const ActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // For demonstration purposes, using mock data
        const mockActivities: Activity[] = [
          {
            id: '1',
            user_id: 'friend-1',
            activity_type: 'workout_completed',
            content: { workout_name: 'Full Body Strength' },
            is_public: true,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            profile: {
              id: 'friend-1',
              first_name: 'John',
              last_name: 'Doe',
              age: 28,
              sex: 'male',
              height: 180,
              weight: 80,
              fitness_goal: 'weight-loss',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: '2',
            user_id: 'friend-2',
            activity_type: 'new_progress',
            content: { progress_type: 'weight', value: '165 lbs' },
            is_public: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
            profile: {
              id: 'friend-2',
              first_name: 'Jane',
              last_name: 'Smith',
              age: 32,
              sex: 'female',
              height: 165,
              weight: 65,
              fitness_goal: 'muscle-gain',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: '3',
            user_id: user.id,
            activity_type: 'goal_completed',
            content: { goal_name: 'Run 10 miles weekly' },
            is_public: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            profile: {
              id: user.id,
              first_name: 'Current',
              last_name: 'User',
              age: 30,
              sex: 'other',
              height: 175,
              weight: 70,
              fitness_goal: 'endurance',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error("Error fetching activity feed:", error);
        toast.error("Failed to load activity feed");
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [user]);
  
  const getUserInitials = (profile?: UserProfile): string => {
    if (!profile) return "?";
    
    if (profile.first_name || profile.last_name) {
      const first = profile.first_name ? profile.first_name[0] : "";
      const last = profile.last_name ? profile.last_name[0] : "";
      return (first + last).toUpperCase();
    }
    
    return "?";
  };
  
  const formatActivityContent = (activity: Activity): string => {
    const userName = `${activity.profile?.first_name || 'Someone'} ${activity.profile?.last_name || ''}`.trim();
    
    switch (activity.activity_type) {
      case 'workout_completed':
        return `${userName} completed a ${activity.content.workout_name} workout`;
      case 'new_friend':
        return `${userName} connected with ${activity.content.friend_name || 'a new friend'}`;
      case 'goal_completed':
        return `${userName} achieved their goal: ${activity.content.goal_name}`;
      case 'new_progress':
        return `${userName} logged new progress: ${activity.content.progress_type} ${activity.content.value}`;
      default:
        return `${userName} did something`;
    }
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 7) {
      return date.toLocaleDateString();
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading activity feed...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500">No activities to show</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div 
            key={activity.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <div className="flex items-start">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-white">
                  {getUserInitials(activity.profile)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p>{formatActivityContent(activity)}</p>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(activity.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityFeed;
