
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

const FriendRequests: React.FC = () => {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // For demonstration purposes, using mock data
        const mockReceivedRequests: FriendRequest[] = [
          {
            id: '3',
            user_id: 'friend-3',
            friend_id: user.id,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile: {
              id: 'friend-3',
              first_name: 'Alex',
              last_name: 'Johnson',
              age: 35,
              sex: 'male',
              height: 175,
              weight: 78,
              fitness_goal: 'general-fitness',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ];
        
        const mockSentRequests: FriendRequest[] = [
          {
            id: '4',
            user_id: user.id,
            friend_id: 'friend-4',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile: {
              id: 'friend-4',
              first_name: 'Sarah',
              last_name: 'Williams',
              age: 29,
              sex: 'female',
              height: 168,
              weight: 62,
              fitness_goal: 'endurance',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ];
        
        setSentRequests(mockSentRequests);
        setReceivedRequests(mockReceivedRequests);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        toast.error("Failed to load friend requests");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriendRequests();
  }, [user]);
  
  const acceptRequest = async (requestId: string) => {
    try {
      // In a real implementation, update the status in the database
      toast.success("Friend request accepted!");
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };
  
  const rejectRequest = async (requestId: string) => {
    try {
      // In a real implementation, update the status in the database
      toast.success("Friend request rejected");
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };
  
  const cancelRequest = async (requestId: string) => {
    try {
      // In a real implementation, delete the request from the database
      toast.success("Friend request canceled");
      setSentRequests(sentRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };
  
  const getUserInitials = (profile?: UserProfile): string => {
    if (!profile) return "?";
    
    if (profile.first_name || profile.last_name) {
      const first = profile.first_name ? profile.first_name[0] : "";
      const last = profile.last_name ? profile.last_name[0] : "";
      return (first + last).toUpperCase();
    }
    
    return "?";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading friend requests...</span>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="received">
            Received Requests ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Requests ({sentRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500">No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials(request.profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="font-medium">
                        {request.profile?.first_name} {request.profile?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => acceptRequest(request.id)} 
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => rejectRequest(request.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500">No pending sent requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials(request.profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="font-medium">
                        {request.profile?.first_name} {request.profile?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Request pending
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => cancelRequest(request.id)}
                  >
                    Cancel Request
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendRequests;
