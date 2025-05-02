
import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FriendsList from "@/components/friends/FriendsList";
import FriendRequests from "@/components/friends/FriendRequests";
import ActivityFeed from "@/components/friends/ActivityFeed";

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
