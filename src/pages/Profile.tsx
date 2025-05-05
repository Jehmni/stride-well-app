
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  
  return (
    <DashboardLayout title="Your Profile">
      {user && profile && (
        <ProfileHeader profile={profile} email={user.email || ""} />
      )}

      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value="account">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold">Account Information</h3>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Profile ID:</strong> {profile?.id}
              </p>
              <p>
                <strong>Fitness Goal:</strong> {profile?.fitness_goal}
              </p>
              <Button>Update Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardContent>
              <p>Appearance settings coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card>
            <CardContent>
              <p>Preference settings coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Profile;
