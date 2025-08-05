
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { showProfileSuccess, showProfileError } from "@/utils/notifications";
import { 
  Save, 
  User, 
  Target, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Shield,
  Mail,
  CalendarDays,
  Settings
} from "lucide-react";
import NutritionTargetsModal from "@/components/nutrition/NutritionTargetsModal";

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  // Form state for personal information
  const [personalInfo, setPersonalInfo] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    age: profile?.age || '',
    sex: profile?.sex || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
  });
  
  // Form state for fitness information
  const [fitnessInfo, setFitnessInfo] = useState({
    fitness_goal: profile?.fitness_goal || '',
    fitness_level: profile?.fitness_level || '',
    activity_level: profile?.activity_level || '',
    workout_frequency_per_week: profile?.workout_frequency_per_week || 3,
    preferred_workout_duration: profile?.preferred_workout_duration || 30
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showNutritionTargets, setShowNutritionTargets] = useState(false);

  // Calculate profile completion percentage
  const profileCompletion = () => {
    const fields = [
      personalInfo.first_name,
      personalInfo.last_name,
      personalInfo.age,
      personalInfo.sex,
      personalInfo.height,
      personalInfo.weight,
      fitnessInfo.fitness_goal,
      fitnessInfo.fitness_level,
      fitnessInfo.activity_level
    ];
    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Update form state when profile data changes
  useEffect(() => {
    if (profile) {
      setPersonalInfo({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        age: profile.age || '',
        sex: profile.sex || '',
        height: profile.height || '',
        weight: profile.weight || '',
      });
      
      setFitnessInfo({
        fitness_goal: profile.fitness_goal || '',
        fitness_level: profile.fitness_level || '',
        activity_level: profile.activity_level || '',
        workout_frequency_per_week: profile.workout_frequency_per_week || 3,
        preferred_workout_duration: profile.preferred_workout_duration || 30
      });
    }
  }, [profile]);

  // Handle personal info updates
  const handlePersonalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...personalInfo,
          age: personalInfo.age ? parseInt(personalInfo.age.toString()) : null,
          height: personalInfo.height ? parseFloat(personalInfo.height.toString()) : null,
          weight: personalInfo.weight ? parseFloat(personalInfo.weight.toString()) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await refreshProfile();
      showProfileSuccess('Personal information updated successfully!');
      setActiveTab("fitness"); // Auto-navigate to next tab
    } catch (error: any) {
      console.error('Error updating personal info:', error);
      showProfileError(error.message || 'Failed to update personal information');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fitness info updates
  const handleFitnessInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Update fitness info in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...fitnessInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;

      // Recalculate nutrition targets based on updated profile/goal
      // This will set daily calories, protein, carbs, and fat based on the user's goal
      const { error: nutritionError } = await supabase.rpc('set_nutrition_targets_for_goal', {
        user_id_param: user.id
      });
      if (nutritionError) throw nutritionError;
      
      await refreshProfile();
      showProfileSuccess('Fitness information and nutrition targets updated successfully!');
      setShowNutritionTargets(true); // Show targets modal after update
    } catch (error: any) {
      console.error('Error updating fitness info:', error);
      showProfileError(error.message || 'Failed to update fitness information');
    } finally {
      setIsLoading(false);
    }
  };

  const completionPercentage = profileCompletion();
  
  return (
    <DashboardLayout title="Your Profile">
             {/* Profile Overview Card */}
       <div className="mb-8">
         <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Complete Your Profile'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-sm">
                {completionPercentage}% Complete
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Profile Completion</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {completionPercentage < 100 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Complete your profile to get personalized recommendations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="personal" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <User className="h-4 w-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger 
            value="fitness" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <Target className="h-4 w-4" />
            Fitness Goals
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <Settings className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>
        
        <Separator className="my-6" />
        
        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
          <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your basic personal details
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePersonalInfoUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium">
                          First Name *
                        </Label>
                        <Input
                          id="first_name"
                          value={personalInfo.first_name}
                          onChange={(e) => setPersonalInfo({...personalInfo, first_name: e.target.value})}
                          placeholder="Enter your first name"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          value={personalInfo.last_name}
                          onChange={(e) => setPersonalInfo({...personalInfo, last_name: e.target.value})}
                          placeholder="Enter your last name"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-sm font-medium">
                          Age *
                        </Label>
                        <Input
                          id="age"
                          type="number"
                          min="13"
                          max="120"
                          value={personalInfo.age}
                          onChange={(e) => setPersonalInfo({...personalInfo, age: e.target.value})}
                          placeholder="Enter your age"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sex" className="text-sm font-medium">
                          Sex *
                        </Label>
                        <Select 
                          value={personalInfo.sex} 
                          onValueChange={(value) => setPersonalInfo({...personalInfo, sex: value})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select your sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-sm font-medium">
                          Height (cm) *
                        </Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          value={personalInfo.height}
                          onChange={(e) => setPersonalInfo({...personalInfo, height: e.target.value})}
                          placeholder="e.g., 175"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-sm font-medium">
                          Weight (kg) *
                        </Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={personalInfo.weight}
                          onChange={(e) => setPersonalInfo({...personalInfo, weight: e.target.value})}
                          placeholder="e.g., 70"
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        Fields marked with * are required
                      </div>
                                             <Button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                         <Save className="h-4 w-4" />
                         {isLoading ? 'Updating...' : 'Save Changes'}
                       </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">BMI</span>
                    <Badge variant="outline">
                      {personalInfo.height && personalInfo.weight 
                        ? ((parseFloat(personalInfo.weight) / Math.pow(parseFloat(personalInfo.height) / 100, 2)).toFixed(1))
                        : 'N/A'
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Age</span>
                    <Badge variant="outline">
                      {personalInfo.age || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sex</span>
                    <Badge variant="outline">
                      {personalInfo.sex ? personalInfo.sex.charAt(0).toUpperCase() + personalInfo.sex.slice(1) : 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Complete Personal Info</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Fill in your basic details</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Set Fitness Goals</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Define your objectives</p>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Fitness Goals Tab */}
        <TabsContent value="fitness" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Fitness Goals & Preferences
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure your fitness objectives and preferences
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFitnessInfoUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fitness_goal" className="text-sm font-medium">
                          Primary Goal *
                        </Label>
                        <Select 
                          value={fitnessInfo.fitness_goal} 
                          onValueChange={(value) => setFitnessInfo({...fitnessInfo, fitness_goal: value})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select your fitness goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight-loss">Weight Loss</SelectItem>
                            <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                            <SelectItem value="general-fitness">General Fitness</SelectItem>
                            <SelectItem value="strength">Strength Training</SelectItem>
                            <SelectItem value="endurance">Endurance</SelectItem>
                            <SelectItem value="flexibility">Flexibility</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fitness_level" className="text-sm font-medium">
                          Current Level *
                        </Label>
                        <Select 
                          value={fitnessInfo.fitness_level} 
                          onValueChange={(value) => setFitnessInfo({...fitnessInfo, fitness_level: value})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select your fitness level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity_level" className="text-sm font-medium">
                          Activity Level *
                        </Label>
                        <Select 
                          value={fitnessInfo.activity_level} 
                          onValueChange={(value) => setFitnessInfo({...fitnessInfo, activity_level: value})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select your activity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                            <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                            <SelectItem value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</SelectItem>
                            <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                            <SelectItem value="extremely_active">Extremely Active (very hard exercise & physical job)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="workout_frequency" className="text-sm font-medium">
                          Workouts per Week *
                        </Label>
                        <Select 
                          value={fitnessInfo.workout_frequency_per_week.toString()} 
                          onValueChange={(value) => setFitnessInfo({...fitnessInfo, workout_frequency_per_week: parseInt(value)})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day per week</SelectItem>
                            <SelectItem value="2">2 days per week</SelectItem>
                            <SelectItem value="3">3 days per week</SelectItem>
                            <SelectItem value="4">4 days per week</SelectItem>
                            <SelectItem value="5">5 days per week</SelectItem>
                            <SelectItem value="6">6 days per week</SelectItem>
                            <SelectItem value="7">7 days per week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="workout_duration" className="text-sm font-medium">
                          Preferred Workout Duration *
                        </Label>
                        <Select 
                          value={fitnessInfo.preferred_workout_duration.toString()} 
                          onValueChange={(value) => setFitnessInfo({...fitnessInfo, preferred_workout_duration: parseInt(value)})}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Zap className="h-4 w-4" />
                        These settings help personalize your workout plans
                      </div>
                                             <Button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg">
                         <Save className="h-4 w-4" />
                         {isLoading ? 'Updating...' : 'Save Goals'}
                       </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Fitness Insights */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fitness Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {fitnessInfo.fitness_goal ? fitnessInfo.fitness_goal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Set Your Goal'}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {fitnessInfo.fitness_level ? `${fitnessInfo.fitness_level.charAt(0).toUpperCase() + fitnessInfo.fitness_level.slice(1)} level` : 'Define your level'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {fitnessInfo.workout_frequency_per_week || 0} workouts/week
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        {fitnessInfo.preferred_workout_duration || 0} min sessions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {fitnessInfo.activity_level ? fitnessInfo.activity_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Set Activity Level'}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Daily activity baseline
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

          <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
            <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Complete Profile</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Get personalized workout recommendations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Set Realistic Goals</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Start with achievable targets</p>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Account Information Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  Account Information
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your account details and security information
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Address</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Member Since</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Onboarding Status</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {profile?.onboarding_completed ? 'Completed' : 'Incomplete'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={profile?.onboarding_completed ? "default" : "secondary"}>
                      {profile?.onboarding_completed ? 'Complete' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Account Actions
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-12">
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <Mail className="h-4 w-4 mr-2" />
                    Update Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <Settings className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12 text-red-600 hover:text-red-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Profile ID: {profile?.id}
                  </p>
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Nutrition Targets Modal */}
      <NutritionTargetsModal
        isOpen={showNutritionTargets}
        onClose={() => setShowNutritionTargets(false)}
        onTargetsUpdated={() => {
          console.log('Nutrition targets updated from profile');
        }}
      />
    </DashboardLayout>
  );
};

export default Profile;
