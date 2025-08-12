import React, { useState, useEffect } from "react";
import { Plus, Activity, Ruler, TrendingUp, TrendingDown, Minus, Target, Calendar, BarChart3, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// Use the correct type from the database types
type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"];

interface ChartData {
  date: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  weight: number | null;
  bodyFat: number | null;
}

const MeasurementsTracker: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [measurementData, setMeasurementData] = useState({
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: "",
    weight: "",
    bodyFat: ""
  });
  const [selectedMetric, setSelectedMetric] = useState<keyof ChartData>("waist");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("measured_at", { ascending: false });

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error) {
      console.error("Error fetching measurements:", error);
      toast.error("Failed to load measurements data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMeasurementData({
      ...measurementData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      
      // Convert string values to numbers, handling empty strings
      const measurementDataToInsert = {
        chest: measurementData.chest ? parseFloat(measurementData.chest) : null,
        waist: measurementData.waist ? parseFloat(measurementData.waist) : null,
        hips: measurementData.hips ? parseFloat(measurementData.hips) : null,
        arms: measurementData.arms ? parseFloat(measurementData.arms) : null,
        thighs: measurementData.thighs ? parseFloat(measurementData.thighs) : null,
        weight: measurementData.weight ? parseFloat(measurementData.weight) : null,
        body_fat_percentage: measurementData.bodyFat ? parseFloat(measurementData.bodyFat) : null
      };

      const { data, error } = await supabase
        .from("body_measurements")
        .insert({
          user_id: user.id,
          ...measurementDataToInsert,
          measured_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Reset form
      setMeasurementData({
        chest: "",
        waist: "",
        hips: "",
        arms: "",
        thighs: "",
        weight: "",
        bodyFat: ""
      });

      // Close form and show success message
      setShowAddForm(false);
      toast.success("Measurements saved successfully!");

      // Refresh measurements
      fetchMeasurements();
      
      // Update user profile weight if weight was measured
      if (measurementDataToInsert.weight) {
        // Update the weight in user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ weight: measurementDataToInsert.weight })
          .eq('id', user.id);
        
        if (profileError) {
          console.error("Error updating profile weight:", profileError);
          toast.error("Failed to update profile weight");
        } else {
          // Refresh user profile to update weight and BMI on dashboard
          await refreshProfile();
          toast.success("Profile weight updated automatically!");
        }
      }
    } catch (error) {
      console.error("Error adding measurement:", error);
      toast.error("Failed to save measurements. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChartData = (): ChartData[] => {
    if (!measurements.length) return [];
    
    // Sort by date (ascending) for the chart
    return [...measurements]
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
      .map(m => ({
        date: format(parseISO(m.measured_at), "MMM d"),
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        arms: m.arms,
        thighs: m.thighs,
        weight: m.weight,
        bodyFat: m.body_fat_percentage
      }));
  };

  const getMostRecentMeasurements = (): BodyMeasurement | null => {
    if (measurements.length === 0) return null;
    return measurements[0];
  };

  const getFilledMeasurements = (): BodyMeasurement | null => {
    if (measurements.length === 0) return null;
    
    const mostRecent = measurements[0];
    const filledMeasurements = { ...mostRecent };
    
    // For each measurement field, if it's null, find the last non-null value
    const measurementFields: (keyof BodyMeasurement)[] = [
      'chest', 'waist', 'hips', 'arms', 'thighs', 'weight', 'body_fat_percentage'
    ];
    
    measurementFields.forEach(field => {
      if (filledMeasurements[field] === null) {
        // Find the last non-null value for this field
        for (let i = 1; i < measurements.length; i++) {
          if (measurements[i][field] !== null) {
            (filledMeasurements as any)[field] = measurements[i][field];
            break;
          }
        }
      }
    });
    
    return filledMeasurements;
  };

  const getMeasurementTrend = (metric: keyof ChartData): { trend: 'up' | 'down' | 'stable', value: number | null } => {
    if (measurements.length < 2) return { trend: 'stable', value: null };
    
    const latest = measurements[0];
    const previous = measurements[1];
    
    const latestValue = latest[metric as keyof BodyMeasurement] as number;
    const previousValue = previous[metric as keyof BodyMeasurement] as number;
    
    if (latestValue && previousValue) {
      const difference = latestValue - previousValue;
      if (Math.abs(difference) < 0.5) return { trend: 'stable', value: difference };
      return { 
        trend: difference > 0 ? 'up' : 'down', 
        value: Math.abs(difference) 
      };
    }
    
    return { trend: 'stable', value: null };
  };

  const getMetricColor = (metric: keyof ChartData): string => {
    const colors = {
      chest: 'from-blue-500 to-blue-600',
      waist: 'from-green-500 to-green-600',
      hips: 'from-purple-500 to-purple-600',
      arms: 'from-orange-500 to-orange-600',
      thighs: 'from-pink-500 to-pink-600',
      weight: 'from-red-500 to-red-600',
      bodyFat: 'from-indigo-500 to-indigo-600'
    };
    return colors[metric] || 'from-gray-500 to-gray-600';
  };

  const getMetricIcon = (metric: keyof ChartData) => {
    const icons = {
      chest: '💪',
      waist: '🎯',
      hips: '📏',
      arms: '💪',
      thighs: '🦵',
      weight: '⚖️',
      bodyFat: '📊'
    };
    return icons[metric] || '📏';
  };

  const mostRecent = getMostRecentMeasurements();
  const filledMeasurements = getFilledMeasurements();
  const chartData = getChartData();

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center p-12"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Ruler className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your measurements...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Body Measurements
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Track your body composition changes over time with detailed analytics
          </p>
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            <span>Missing measurements are automatically filled with your last available data</span>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            variant={showAddForm ? "secondary" : "default"}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
          >
            {showAddForm ? (
              <>
                <Minus className="mr-2 h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add Measurements
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl text-blue-700 dark:text-blue-300">
                  <Target className="h-6 w-6" />
                  Record New Measurements
                </CardTitle>
                <CardDescription className="text-lg">
                  Enter your current body measurements in centimeters (cm)
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: 'chest', label: 'Chest (cm)', icon: '💪', color: 'from-blue-500 to-blue-600' },
                      { name: 'waist', label: 'Waist (cm)', icon: '🎯', color: 'from-green-500 to-green-600' },
                      { name: 'hips', label: 'Hips (cm)', icon: '📏', color: 'from-purple-500 to-purple-600' },
                      { name: 'arms', label: 'Arms (cm)', icon: '💪', color: 'from-orange-500 to-orange-600' },
                      { name: 'thighs', label: 'Thighs (cm)', icon: '🦵', color: 'from-pink-500 to-pink-600' },
                      { name: 'weight', label: 'Weight (kg)', icon: '⚖️', color: 'from-red-500 to-red-600' },
                      { name: 'bodyFat', label: 'Body Fat %', icon: '📊', color: 'from-indigo-500 to-indigo-600' }
                    ].map((field) => (
                      <motion.div
                        key={field.name}
                        whileHover={{ scale: 1.02 }}
                        className="space-y-2"
                      >
                        <Label htmlFor={field.name} className="text-sm font-semibold flex items-center gap-2">
                          <span className="text-2xl">{field.icon}</span>
                          {field.label}
                        </Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.1"
                          placeholder="e.g., 100.5"
                          value={measurementData[field.name as keyof typeof measurementData]}
                          onChange={handleInputChange}
                          className="border-2 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                        />
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg py-3 shadow-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-5 w-5" />
                            </motion.div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-5 w-5" />
                            Save Measurements
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {measurements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700">
            <CardContent className="pt-12 pb-12">
              <div className="text-center py-8">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Ruler className="h-20 w-20 mx-auto mb-6 text-blue-400" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-300">
                  No Measurements Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                  Start tracking your body composition journey by adding your first set of measurements.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Record First Measurement
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          {/* Current Measurements Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: 'chest', label: 'Chest', icon: '💪', color: 'from-blue-500 to-blue-600' },
              { key: 'waist', label: 'Waist', icon: '🎯', color: 'from-green-500 to-green-600' },
              { key: 'hips', label: 'Hips', icon: '📏', color: 'from-purple-500 to-purple-600' },
              { key: 'arms', label: 'Arms', icon: '💪', color: 'from-orange-500 to-orange-600' },
              { key: 'thighs', label: 'Thighs', icon: '🦵', color: 'from-pink-500 to-pink-600' },
              { key: 'weight', label: 'Weight', icon: '⚖️', color: 'from-red-500 to-red-600' },
              { key: 'bodyFat', label: 'Body Fat', icon: '📊', color: 'from-indigo-500 to-indigo-600' }
            ].map((metric, index) => {
              const value = filledMeasurements?.[metric.key as keyof BodyMeasurement];
              const trend = getMeasurementTrend(metric.key as keyof ChartData);
              const lastMeasured = mostRecent ? differenceInDays(new Date(), new Date(mostRecent.measured_at)) : 0;
              
              // Check if this measurement is from today or filled from previous data
              const isFromToday = mostRecent?.[metric.key as keyof BodyMeasurement] !== null;
              const measurementDate = isFromToday ? mostRecent?.measured_at : 
                measurements.find(m => m[metric.key as keyof BodyMeasurement] !== null)?.measured_at;
              const daysAgo = measurementDate ? differenceInDays(new Date(), new Date(measurementDate)) : 0;
              
              return (
                <motion.div
                  key={metric.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card className={`bg-gradient-to-br ${metric.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{metric.icon}</span>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                          </Badge>
                          {!isFromToday && (
                            <Badge variant="outline" className="bg-white/10 text-white/80 border-white/30 text-xs">
                              Previous Data
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">{metric.label}</h3>
                      <div className="text-3xl font-bold mb-2">
                        {value ? `${value}` : '--'}
                        <span className="text-lg ml-1">
                          {metric.key === 'weight' ? 'kg' : metric.key === 'bodyFat' ? '%' : 'cm'}
                        </span>
                      </div>
                      
                      {trend.value !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          {trend.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-200" />
                          ) : trend.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-200" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-200" />
                          )}
                          <span className="text-white/80">
                            {trend.trend === 'stable' ? 'Stable' : 
                             `${trend.trend === 'up' ? '+' : '-'}${trend.value?.toFixed(1)}`
                            }
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Measurement Chart */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-xl">Measurement Progress</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'chest', label: 'Chest', color: 'bg-blue-500' },
                    { key: 'waist', label: 'Waist', color: 'bg-green-500' },
                    { key: 'hips', label: 'Hips', color: 'bg-purple-500' },
                    { key: 'arms', label: 'Arms', color: 'bg-orange-500' },
                    { key: 'thighs', label: 'Thighs', color: 'bg-pink-500' },
                    { key: 'weight', label: 'Weight', color: 'bg-red-500' },
                    { key: 'bodyFat', label: 'Body Fat', color: 'bg-indigo-500' }
                  ].map((metric) => (
                    <motion.div
                      key={metric.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant={selectedMetric === metric.key ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSelectedMetric(metric.key as keyof ChartData)}
                        className={`${
                          selectedMetric === metric.key 
                            ? `${metric.color} text-white border-0` 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        } transition-all duration-200`}
                      >
                        {metric.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`color-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getMetricColor(selectedMetric).split(' ')[1]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={getMetricColor(selectedMetric).split(' ')[1]} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={getMetricColor(selectedMetric).split(' ')[1]}
                      strokeWidth={3}
                      fill={`url(#color-${selectedMetric})`}
                      dot={{ 
                        fill: getMetricColor(selectedMetric).split(' ')[1], 
                        strokeWidth: 2, 
                        r: 5,
                        stroke: 'white'
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Measurement History Table */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-xl">Measurement History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Chest</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Waist</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Hips</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Arms</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Thighs</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Weight</th>
                      <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Body Fat %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((measurement, index) => (
                      <motion.tr 
                        key={measurement.id} 
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {format(parseISO(measurement.measured_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.chest || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.waist || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.hips || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.arms || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.thighs || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.weight || "-"}</td>
                        <td className="py-4 px-6 text-right text-sm font-medium">{measurement.body_fat_percentage || "-"}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MeasurementsTracker; 