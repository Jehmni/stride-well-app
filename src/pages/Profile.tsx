
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UserAvatar from "@/components/profile/UserAvatar";
import { FitnessGoals } from "@/models/models";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    age: "",
    sex: "",
    height: "",
    weight: "",
    fitness_goal: "",
  });

  useEffect(() => {
    if (profile) {
      setFormState({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        age: profile.age?.toString() || "",
        sex: profile.sex || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        fitness_goal: profile.fitness_goal || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);

      const updates = {
        id: user.id,
        first_name: formState.first_name,
        last_name: formState.last_name,
        age: parseInt(formState.age) || null,
        sex: formState.sex,
        height: parseFloat(formState.height) || null,
        weight: parseFloat(formState.weight) || null,
        fitness_goal: formState.fitness_goal,
      };

      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <DashboardLayout title="Profile Settings">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and fitness goals.
                  </CardDescription>
                </div>
                <div className="flex justify-center">
                  <UserAvatar size="lg" showUploadButton={true} />
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formState.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formState.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      placeholder="Email Address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formState.age}
                      onChange={handleChange}
                      placeholder="Age"
                      min="18"
                      max="120"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("sex", value)}
                      value={formState.sex}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      value={formState.height}
                      onChange={handleChange}
                      placeholder="Height in cm"
                      min="100"
                      max="250"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      value={formState.weight}
                      onChange={handleChange}
                      placeholder="Weight in kg"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fitness_goal">Fitness Goal</Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("fitness_goal", value)
                      }
                      value={formState.fitness_goal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fitness goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight-loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                        <SelectItem value="endurance">
                          Endurance Training
                        </SelectItem>
                        <SelectItem value="general-fitness">
                          General Fitness
                        </SelectItem>
                        <SelectItem value="strength">
                          Strength Training
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Change your password or reset it if you've forgotten it.
                </p>
              </div>
              <div className="flex justify-end">
                <Button>Change Password</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleLogout}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Notifications Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the app looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Theme Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Profile;
