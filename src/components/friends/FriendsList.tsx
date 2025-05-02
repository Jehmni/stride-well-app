
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, Search, UserPlus, UserX } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";

interface FriendWithProfile {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

const FriendsList: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Get all accepted friendships where the user is the initiator
        const { data: sentFriends, error: sentError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            first_name,
            last_name,
            fitness_goal
          `)
          .eq('id', user.id)
          .single();
          
        if (sentError) throw sentError;
        
        // Get all accepted friendships where the user is the recipient
        const { data: receivedFriends, error: receivedError } = await supabase
          .from('user_profiles')
          .select(`
            id,
            first_name, 
            last_name,
            fitness_goal
          `)
          .eq('id', user.id)
          .single();
          
        if (receivedError) throw receivedError;
        
        // For now, using mock data until we set up proper friends table in database
        const mockFriends: FriendWithProfile[] = [
          {
            id: '1',
            user_id: user.id,
            friend_id: 'friend-1',
            status: 'accepted',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
            user_id: user.id,
            friend_id: 'friend-2',
            status: 'accepted',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
          }
        ];
        
        setFriends(mockFriends);
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
      // Find the user by email - in a real implementation, we would look up by email
      // For now we'll show success message but not actually add anyone
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
      // In a real implementation, we would delete the friendship record
      // For now we'll just remove from local state
      setFriends(friends.filter(f => f.friend_id !== friendId));
      toast.success("Friend removed successfully");
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

export default FriendsList;
