import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Bell, 
  Lock, 
  LogOut, 
  User,
  AlertTriangle,
  Edit
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Calculate BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  const bmiCategory = userBMI ? getBMICategory(userBMI) : null;
  
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: 30,
    sex: "male",
    weight: 75,
    height: 175,
    fitnessGoal: "general-fitness"
  });
  
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    progressUpdates: true,
    nutritionReminders: false,
    tips: true,
    email: false
  });
  
  const [appearance, setAppearance] = useState("system");
  
  // Load user data when component mounts
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: user?.email || "",
        age: profile.age,
        sex: profile.sex,
        weight: profile.weight,
        height: profile.height,
        fitnessGoal: profile.fitness_goal
      });
    }
  }, [profile, user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };
    const handleSavePersonalInfo = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if fitness goal was changed
      const fitnessGoalChanged = profile && profile.fitness_goal !== personalInfo.fitnessGoal;
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          age: personalInfo.age,
          sex: personalInfo.sex,
          height: personalInfo.height,
          weight: personalInfo.weight,
          fitness_goal: personalInfo.fitnessGoal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh the profile data from context
      await refreshProfile();
      
      // If fitness goal was changed, mark workout plans for regeneration
      if (fitnessGoalChanged) {
        // We could trigger a real-time update here, but for simplicity
        // we'll just inform the user that workouts will be updated
        toast.success("Profile updated! Your workout plan will be personalized to your new fitness goal.");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveNotifications = () => {
    // In a real app, this would save notification preferences to the database
    // For now, we'll just show a success message
    toast.success("Notification preferences updated successfully!");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Delete the user's account from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      // Sign out and navigate to login page
      await signOut();
      toast.success("Your account has been deleted successfully");
      navigate("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader profile={profile} email={user?.email} />
        
        <Tabs defaultValue="personal" className="mb-8">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center justify-center">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Personal Info</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center justify-center">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center justify-center">
              <Lock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Account Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={personalInfo.email}
                    readOnly
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email changes must be done from the account settings</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      type="number" 
                      value={personalInfo.age}
                      onChange={(e) => setPersonalInfo({...personalInfo, age: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      value={personalInfo.weight}
                      onChange={(e) => setPersonalInfo({...personalInfo, weight: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input 
                      id="height" 
                      type="number" 
                      value={personalInfo.height}
                      onChange={(e) => setPersonalInfo({...personalInfo, height: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroup 
                        value={personalInfo.sex} 
                        onValueChange={(value) => setPersonalInfo({...personalInfo, sex: value})}
                        className="flex space-x-8"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Fitness Goals</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <RadioGroup 
                      value={personalInfo.fitnessGoal} 
                      onValueChange={(value) => setPersonalInfo({...personalInfo, fitnessGoal: value})}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weight-loss" id="weight-loss" />
                        <Label htmlFor="weight-loss">Weight Loss</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="muscle-gain" id="muscle-gain" />
                        <Label htmlFor="muscle-gain">Muscle Gain</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="general-fitness" id="general-fitness" />
                        <Label htmlFor="general-fitness">General Fitness</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="endurance" id="endurance" />
                        <Label htmlFor="endurance">Endurance</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">Body Mass Index (BMI)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Your BMI</p>
                      <p className="text-xl font-bold">{userBMI ? userBMI.toFixed(1) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="text-xl font-bold">{bmiCategory || "Not calculated"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Healthy BMI Range</p>
                      <p className="font-medium">18.5 - 24.9</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    BMI is calculated based on your height and weight. It's a screening tool, not a diagnostic of body fatness or health.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSavePersonalInfo} 
                  className="w-full fitness-button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Workout Reminders</p>
                      <p className="text-sm text-gray-500">Get notified before your scheduled workouts</p>
                    </div>
                    <Switch 
                      checked={notifications.workoutReminders} 
                      onCheckedChange={(checked) => setNotifications({...notifications, workoutReminders: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Progress Updates</p>
                      <p className="text-sm text-gray-500">Weekly summaries of your fitness progress</p>
                    </div>
                    <Switch 
                      checked={notifications.progressUpdates} 
                      onCheckedChange={(checked) => setNotifications({...notifications, progressUpdates: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nutrition Reminders</p>
                      <p className="text-sm text-gray-500">Meal timing and hydration reminders</p>
                    </div>
                    <Switch 
                      checked={notifications.nutritionReminders} 
                      onCheckedChange={(checked) => setNotifications({...notifications, nutritionReminders: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Fitness Tips & Advice</p>
                      <p className="text-sm text-gray-500">Receive helpful tips to improve your fitness</p>
                    </div>
                    <Switch 
                      checked={notifications.tips} 
                      onCheckedChange={(checked) => setNotifications({...notifications, tips: checked})}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium mb-4">Email Notifications</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Updates</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={notifications.email} 
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications} className="w-full fitness-button-primary">
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <h3 className="text-lg font-semibold">Account Settings</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Change Password</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button className="w-full">Update Password</Button>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <h4 className="font-medium">Appearance</h4>
                  <RadioGroup 
                    value={appearance} 
                    onValueChange={setAppearance}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2m2 6h-2m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <Label htmlFor="light" className={appearance === "light" ? "font-medium" : ""}>
                        Light
                      </Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <Label htmlFor="dark" className={appearance === "dark" ? "font-medium" : ""}>
                        Dark
                      </Label>
                    </div>
                    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="system" id="system" className="sr-only" />
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-100 to-gray-900 flex items-center justify-center">
                        <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <Label htmlFor="system" className={appearance === "system" ? "font-medium" : ""}>
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                  <Button variant="outline" className="w-full">
                    Save Preferences
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-red-500 mb-2">Danger Zone</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    These actions are permanent and cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={handleLogout} variant="destructive" className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data, including workout history, 
              meal plans, and progress tracking will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              disabled={isLoading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Profile;
