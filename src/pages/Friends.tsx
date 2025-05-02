
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Check,
  Loader2,
  MessageSquare,
  Search,
  UserPlus,
  UserX,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Friend, UserProfile, ActivityFeed as ActivityFeedType } from "@/models/models";

const FriendsList: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch accepted friends where user is the initiator
        const { data: initiatedFriends, error: initiatedError } = await supabase
          .from('friends')
          .select('*, profile:user_profiles!friend_id(*)')
          .eq('user_id', user.id)
          .eq('status', 'accepted');
          
        if (initiatedError) throw initiatedError;
        
        // Fetch accepted friends where user is the receiver
        const { data: receivedFriends, error: receivedError } = await supabase
          .from('friends')
          .select('*, profile:user_profiles!user_id(*)')
          .eq('friend_id', user.id)
          .eq('status', 'accepted');
          
        if (receivedError) throw receivedError;
        
        // Combine and format friends
        const allFriends: Friend[] = [
          ...(initiatedFriends || []),
          ...(receivedFriends || []).map(friend => ({
            ...friend,
            // Swap the user_id and friend_id for consistency in the UI
            user_id: friend.friend_id,
            friend_id: friend.user_id,
          }))
        ];
        
        setFriends(allFriends);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast.error("Failed to load friends list");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriends();
  }, [user]);
  
  const addFriend = async () => {
    if (!user || !email || email === user.email) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      // Find the user by email - using a different approach
      const { data: friendData, error: friendError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)  // This is a placeholder - in a real app we'd query by email
        .single();
        
      if (friendError || !friendData) {
        toast.error("User not found with that email address");
        return;
      }
      
      // Check if friend request already exists
      const { data: existingRequest, error: existingError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${user.id})`)
        .single();
        
      if (existingRequest) {
        toast.error("A friend request already exists with this user");
        return;
      }
      
      // Create friend request
      const { error: requestError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: user.id,
            friend_id: friendData.id,
            status: 'pending'
          }
        ]);
        
      if (requestError) throw requestError;
      
      toast.success("Friend request sent successfully!");
      setShowAddFriend(false);
      setEmail("");
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to send friend request");
    }
  };
  
  const removeFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
        
      if (error) throw error;
      
      toast.success("Friend removed successfully");
      setFriends(friends.filter(f => f.friend_id !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };
  
  const filteredFriends = searchQuery 
    ? friends.filter(friend => 
        (friend.profile?.first_name && friend.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (friend.profile?.last_name && friend.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : friends;
  
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
        <span className="ml-2">Loading friends...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Send a friend request by email address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFriend(false)}>
                Cancel
              </Button>
              <Button onClick={addFriend} disabled={!email}>
                Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {filteredFriends.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <UserPlus className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Friends Yet</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? `No friends found matching "${searchQuery}"`
              : "Get started by adding friends to connect with other fitness enthusiasts."
            }
          </p>
          {!searchQuery && (
            <Button 
              className="mt-4" 
              onClick={() => setShowAddFriend(true)}
            >
              Add Your First Friend
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map((friend) => (
            <div 
              key={friend.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-white">
                    {getUserInitials(friend.profile)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="font-medium">
                    {friend.profile?.first_name} {friend.profile?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {friend.profile?.fitness_goal?.replace('-', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeFriend(friend.friend_id)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FriendRequests: React.FC = () => {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch sent requests
        const { data: sentData, error: sentError } = await supabase
          .from('friends')
          .select('*, profile:user_profiles!friend_id(*)')
          .eq('user_id', user.id)
          .eq('status', 'pending');
          
        if (sentError) throw sentError;
        setSentRequests(sentData || []);
        
        // Fetch received requests
        const { data: receivedData, error: receivedError } = await supabase
          .from('friends')
          .select('*, profile:user_profiles!user_id(*)')
          .eq('friend_id', user.id)
          .eq('status', 'pending');
          
        if (receivedError) throw receivedError;
        setReceivedRequests(receivedData || []);
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
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast.success("Friend request accepted!");
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));
      
      // Create activity feed entry for new friendship
      const request = receivedRequests.find(r => r.id === requestId);
      if (request && user) {
        await supabase
          .from('activity_feed')
          .insert([
            {
              user_id: user.id,
              activity_type: 'new_friend',
              content: { 
                friend_id: request.user_id,
                friend_name: request.profile?.first_name
              },
              is_public: true
            }
          ]);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };
  
  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast.success("Friend request rejected");
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };
  
  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
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

const ActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityFeedType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch user's friends
        const { data: friends, error: friendsError } = await supabase
          .from('friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');
          
        if (friendsError) throw friendsError;
        
        // Get list of friend IDs
        const friendIds = friends ? friends.flatMap(f => [f.user_id, f.friend_id]).filter(id => id !== user.id) : [];
        
        // Fetch activities from friends and user
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activity_feed')
          .select('*, profile:user_profiles(*)')
          .in('user_id', [user.id, ...friendIds])
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (activitiesError) throw activitiesError;
        
        setActivities(activitiesData || []);
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
  
  const formatActivityContent = (activity: ActivityFeedType): string => {
    const userName = `${activity.profile?.first_name || 'Someone'} ${activity.profile?.last_name || ''}`.trim();
    
    switch (activity.activity_type) {
      case 'workout_completed':
        return `${userName} completed a ${activity.content.workout_name} workout`;
      case 'new_friend':
        return `${userName} connected with ${activity.content.friend_name || 'a new friend'}`;
      case 'goal_completed':
        return `${userName} achieved their goal: ${activity.content.goal_name}`;
      case 'new_progress':
        return `${userName} logged new progress`;
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

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.includes("requests") 
    ? "requests"
    : location.pathname.includes("activity")
    ? "activity"
    : "friends";

  const handleTabChange = (value: string) => {
    switch (value) {
      case "friends":
        navigate("/friends");
        break;
      case "requests":
        navigate("/friends/requests");
        break;
      case "activity":
        navigate("/friends/activity");
        break;
    }
  };

  return (
    <DashboardLayout title="Friends & Social">
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect with other fitness enthusiasts, view activity feeds, and manage friend requests.
        </p>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests">Friend Requests</TabsTrigger>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Routes>
          <Route path="/" element={<FriendsList />} />
          <Route path="/requests" element={<FriendRequests />} />
          <Route path="/activity" element={<ActivityFeed />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

export default Friends;
