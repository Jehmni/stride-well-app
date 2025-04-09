
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Bell, 
  Camera, 
  Edit2, 
  Lock, 
  LogOut, 
  Mail, 
  Share2, 
  User 
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

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  
  const [personalInfo, setPersonalInfo] = useState({
    name: userProfile.name || "John Doe",
    email: "john.doe@example.com",
    age: userProfile.age || 30,
    sex: userProfile.sex || "male",
    weight: userProfile.weight || 75,
    height: userProfile.height || 175,
    fitnessGoal: userProfile.fitnessGoal || "general-fitness"
  });
  
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    progressUpdates: true,
    nutritionReminders: false,
    tips: true,
    email: false
  });
  
  const [appearance, setAppearance] = useState("system");
  
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("isOnboarded");
    navigate("/login");
  };
  
  const handleSavePersonalInfo = () => {
    localStorage.setItem("userProfile", JSON.stringify(personalInfo));
    toast.success("Profile information updated successfully!");
  };
  
  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated successfully!");
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-2xl font-bold">
              {personalInfo.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button className="absolute bottom-0 right-0 bg-fitness-primary text-white p-1 rounded-full">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{personalInfo.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{personalInfo.email}</p>
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="h-4 w-4 mr-1" />
              <span>{personalInfo.fitnessGoal === "weight-loss" ? "Weight Loss" : 
                      personalInfo.fitnessGoal === "muscle-gain" ? "Muscle Gain" : 
                      personalInfo.fitnessGoal === "endurance" ? "Endurance" : 
                      "General Fitness"} Goal</span>
            </div>
          </div>
          <div className="md:ml-auto mt-4 md:mt-0">
            <Button variant="outline" className="flex items-center">
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>
        
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
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    />
                  </div>
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
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePersonalInfo} className="w-full fitness-button-primary">
                  Save Changes
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
                          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
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
                    <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
