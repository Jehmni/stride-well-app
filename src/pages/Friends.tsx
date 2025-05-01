import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Search, UserPlus, Users, Share2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FriendProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  fitness_goal: string | null;
  workouts_count: number;
  avatar_url: string | null;
  email: string;
};

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender: FriendProfile;
};

type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend: FriendProfile;
};

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch friends and friend requests
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      try {
        // Fetch established friends
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select(`
            id,
            user_id,
            friend_id,
            created_at,
            friend:friend_id(
              id,
              first_name,
              last_name,
              fitness_goal,
              avatar_url
            )
          `)
          .eq('user_id', profile.id);
          
        if (friendsError) throw friendsError;
        
        // Enhance friends data with email and workout count
        const enhancedFriends = await Promise.all((friendsData || []).map(async (friend) => {
          // Get email from auth.users
          const { data: userData } = await supabase
            .from('auth_users_view')
            .select('email')
            .eq('id', friend.friend_id)
            .single();
            
          // Get workout count
          const { count } = await supabase
            .from('completed_workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', friend.friend_id);
            
          return {
            ...friend,
            friend: {
              ...friend.friend,
              email: userData?.email || '',
              workouts_count: count || 0
            }
          };
        }));
        
        setFriends(enhancedFriends);
        
        // Fetch friend requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('friend_requests')
          .select(`
            id,
            sender_id,
            receiver_id,
            created_at,
            sender:sender_id(
              id,
              first_name,
              last_name,
              fitness_goal,
              avatar_url
            )
          `)
          .eq('receiver_id', profile.id)
          .is('accepted', null);
          
        if (requestsError) throw requestsError;
        
        // Enhance requests data with email and workout count
        const enhancedRequests = await Promise.all((requestsData || []).map(async (request) => {
          // Get email from auth.users
          const { data: userData } = await supabase
            .from('auth_users_view')
            .select('email')
            .eq('id', request.sender_id)
            .single();
            
          // Get workout count
          const { count } = await supabase
            .from('completed_workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', request.sender_id);
            
          return {
            ...request,
            sender: {
              ...request.sender,
              email: userData?.email || '',
              workouts_count: count || 0
            }
          };
        }));
        
        setFriendRequests(enhancedRequests);
        
      } catch (error: any) {
        console.error("Error fetching friends data:", error);
        toast.error("Failed to load friends data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriendsData();
  }, [profile]);
  
  // Search for users
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search in user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          first_name,
          last_name,
          fitness_goal,
          avatar_url
        `)
        .or(`
          first_name.ilike.%${searchQuery}%,
          last_name.ilike.%${searchQuery}%
        `)
        .neq('id', profile?.id || '');
        
      if (error) throw error;
      
      // Filter out users who are already friends
      const friendIds = friends.map(f => f.friend_id);
      const filteredResults = data?.filter(user => !friendIds.includes(user.id)) || [];
      
      // Enhance with email
      const enhancedResults = await Promise.all(filteredResults.map(async (user) => {
        // Get email from auth.users
        const { data: userData } = await supabase
          .from('auth_users_view')
          .select('email')
          .eq('id', user.id)
          .single();
          
        // Get workout count
        const { count } = await supabase
          .from('completed_workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        return {
          ...user,
          email: userData?.email || '',
          workouts_count: count || 0
        };
      }));
      
      setSearchResults(enhancedResults);
      
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };
  
  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    if (!profile) return;
    
    try {
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', profile.id)
        .eq('receiver_id', userId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingRequest) {
        toast.info("Friend request already sent");
        return;
      }
      
      // Create new request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: profile.id,
          receiver_id: userId
        });
        
      if (error) throw error;
      
      toast.success("Friend request sent!");
      
      // Update search results to show pending
      setSearchResults(prev => 
        prev.filter(user => user.id !== userId)
      );
      
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };
  
  // Accept friend request
  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!profile) return;
    
    try {
      // Mark request as accepted
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ accepted: true })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // Create friend connections (both ways)
      const { error: insertError } = await supabase
        .from('friends')
        .insert([
          { user_id: profile.id, friend_id: senderId },
          { user_id: senderId, friend_id: profile.id }
        ]);
        
      if (insertError) throw insertError;
      
      toast.success("Friend request accepted!");
      
      // Update UI
      setFriendRequests(prev => 
        prev.filter(request => request.id !== requestId)
      );
      
      // Refresh friends list
      const { data: friendData } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          created_at,
          friend:friend_id(
            id,
            first_name,
            last_name,
            fitness_goal,
            avatar_url
          )
        `)
        .eq('user_id', profile.id)
        .eq('friend_id', senderId)
        .single();
        
      if (friendData) {
        // Get email
        const { data: userData } = await supabase
          .from('auth_users_view')
          .select('email')
          .eq('id', senderId)
          .single();
          
        // Get workout count
        const { count } = await supabase
          .from('completed_workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', senderId);
          
        const newFriend = {
          ...friendData,
          friend: {
            ...friendData.friend,
            email: userData?.email || '',
            workouts_count: count || 0
          }
        };
        
        setFriends(prev => [...prev, newFriend]);
      }
      
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };
  
  // Reject friend request
  const rejectFriendRequest = async (requestId: string) => {
    try {
      // Delete the request
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast.success("Friend request rejected");
      
      // Update UI
      setFriendRequests(prev => 
        prev.filter(request => request.id !== requestId)
      );
      
    } catch (error: any) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };
  
  // Share workout with a friend
  const shareWorkout = async (friendId: string) => {
    if (!profile) return;
    
    try {
      // Get user's most recent workout
      const { data: workout, error: workoutError } = await supabase
        .from('completed_workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
        
      if (workoutError) {
        toast.error("You don't have any completed workouts to share");
        return;
      }
      
      // Create workout share
      const { error } = await supabase
        .from('workout_shares')
        .insert({
          sender_id: profile.id,
          receiver_id: friendId,
          workout_id: workout.id,
          message: `Check out my ${workout.workout_title} workout!`
        });
        
      if (error) throw error;
      
      toast.success("Workout shared successfully!");
      
    } catch (error: any) {
      console.error("Error sharing workout:", error);
      toast.error("Failed to share workout");
    }
  };

  return (
    <DashboardLayout title="Friends">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Fitness Network</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect with friends, share workouts, and get motivated together.
        </p>
        
        <Tabs defaultValue="friends" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="friends" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="find" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Find Friends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends">
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {friends.map((friend) => (
                  <Card key={friend.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border">
                          <AvatarImage src={friend.friend.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.friend.first_name?.[0] || ''}
                            {friend.friend.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {friend.friend.first_name} {friend.friend.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {friend.friend.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {friend.friend.fitness_goal?.replace('-', ' ')}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              {friend.friend.workouts_count} workouts
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => shareWorkout(friend.friend.id)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Workout
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                <p className="text-gray-500 mb-4">
                  Find and add friends to share your fitness journey.
                </p>
                <Button onClick={() => document.querySelector('[data-value="find"]')?.click()}>
                  Find Friends
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests">
            {friendRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {friendRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border">
                          <AvatarImage src={request.sender.avatar_url || undefined} />
                          <AvatarFallback>
                            {request.sender.first_name?.[0] || ''}
                            {request.sender.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.sender.first_name} {request.sender.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.sender.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {request.sender.fitness_goal?.replace('-', ' ')}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              {request.sender.workouts_count} workouts
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex gap-2 ml-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectFriendRequest(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => acceptFriendRequest(request.id, request.sender_id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-gray-500">
                  You don't have any friend requests at the moment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="find">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </form>
              
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.first_name?.[0] || ''}
                              {user.last_name?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {user.fitness_goal?.replace('-', ' ')}
                              </span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                {user.workouts_count} workouts
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="ml-auto"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Friend
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching "{searchQuery}"</p>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Friends; 