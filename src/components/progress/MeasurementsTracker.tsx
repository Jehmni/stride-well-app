import React, { useState, useEffect } from "react";
import { Plus, Activity, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";

// Use the correct type from the database types
type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"];

// Type for chart data
type ChartData = {
  date: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  weight: number | null;
  bodyFat: number | null;
};

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

  const mostRecent = getMostRecentMeasurements();
  const chartData = getChartData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Ruler className="animate-spin h-6 w-6 mr-2" />
        <span>Loading measurements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Body Measurements</h2>
          <p className="text-gray-500">Track your body composition changes over time</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "secondary" : "default"}>
          {showAddForm ? "Cancel" : "Add Measurements"}
          {!showAddForm && <Plus className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record New Measurements</CardTitle>
            <CardDescription>Enter your current body measurements in centimeters (cm)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chest" className="text-sm font-medium">
                    Chest (cm)
                  </Label>
                  <Input
                    id="chest"
                    name="chest"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 100.5"
                    value={measurementData.chest}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="waist" className="text-sm font-medium">
                    Waist (cm)
                  </Label>
                  <Input
                    id="waist"
                    name="waist"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 80.5"
                    value={measurementData.waist}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="hips" className="text-sm font-medium">
                    Hips (cm)
                  </Label>
                  <Input
                    id="hips"
                    name="hips"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 95.0"
                    value={measurementData.hips}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="arms" className="text-sm font-medium">
                    Arms (cm)
                  </Label>
                  <Input
                    id="arms"
                    name="arms"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 35.5"
                    value={measurementData.arms}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="thighs" className="text-sm font-medium">
                    Thighs (cm)
                  </Label>
                  <Input
                    id="thighs"
                    name="thighs"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 55.0"
                    value={measurementData.thighs}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-sm font-medium">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 70.5"
                    value={measurementData.weight}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="bodyFat" className="text-sm font-medium">
                    Body Fat %
                  </Label>
                  <Input
                    id="bodyFat"
                    name="bodyFat"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 15.0"
                    value={measurementData.bodyFat}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Measurements"}
                  </Button>
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Ruler className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Measurements Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add your body measurements to start tracking your progress.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Record First Measurement
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Measurements Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Chest</h3>
              <div className="text-2xl font-bold">{mostRecent?.chest || "--"} cm</div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Waist</h3>
              <div className="text-2xl font-bold">{mostRecent?.waist || "--"} cm</div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Hips</h3>
              <div className="text-2xl font-bold">{mostRecent?.hips || "--"} cm</div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Arms</h3>
              <div className="text-2xl font-bold">{mostRecent?.arms || "--"} cm</div>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Thighs</h3>
              <div className="text-2xl font-bold">{mostRecent?.thighs || "--"} cm</div>
            </Card>
          </div>

          {/* Measurement Chart */}
          <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Measurement Progress</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedMetric === "chest" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("chest")}
                  >
                    Chest
                  </Button>
                  <Button 
                    variant={selectedMetric === "waist" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("waist")}
                  >
                    Waist
                  </Button>
                  <Button 
                    variant={selectedMetric === "hips" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("hips")}
                  >
                    Hips
                  </Button>
                  <Button 
                    variant={selectedMetric === "arms" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("arms")}
                  >
                    Arms
                  </Button>
                  <Button 
                    variant={selectedMetric === "thighs" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("thighs")}
                  >
                    Thighs
                  </Button>
                  <Button 
                    variant={selectedMetric === "weight" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("weight")}
                  >
                    Weight
                  </Button>
                  <Button 
                    variant={selectedMetric === "bodyFat" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedMetric("bodyFat")}
                  >
                    Body Fat %
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Measurement History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Measurement History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-right font-medium">Chest</th>
                      <th className="py-3 px-4 text-right font-medium">Waist</th>
                      <th className="py-3 px-4 text-right font-medium">Hips</th>
                      <th className="py-3 px-4 text-right font-medium">Arms</th>
                      <th className="py-3 px-4 text-right font-medium">Thighs</th>
                      <th className="py-3 px-4 text-right font-medium">Weight</th>
                      <th className="py-3 px-4 text-right font-medium">Body Fat %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((measurement) => (
                      <tr key={measurement.id} className="border-b">
                        <td className="py-3 px-4">
                          {format(parseISO(measurement.measured_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-right">{measurement.chest || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.waist || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.hips || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.arms || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.thighs || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.weight || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.body_fat_percentage || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MeasurementsTracker; 