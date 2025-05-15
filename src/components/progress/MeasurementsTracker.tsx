import React, { useState, useEffect } from "react";
import { Plus, Save, Activity, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Database } from "@/integrations/supabase/types";

type BodyMeasurement = Database['public']['Tables']['body_measurements']['Row'];

const MeasurementsTracker: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [newMeasurement, setNewMeasurement] = useState({
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: ""
  });
  const [selectedMetric, setSelectedMetric] = useState<keyof BodyMeasurement>("waist");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

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
    setNewMeasurement({
      ...newMeasurement,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Convert empty strings to null and other values to numbers
      const measurementData = Object.entries(newMeasurement).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value === "" ? null : parseFloat(value)
        }),
        {}
      );

      const { data, error } = await supabase
        .from("body_measurements")
        .insert({
          user_id: user.id,
          ...measurementData,
          recorded_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      toast.success("Measurements saved successfully!");
      setNewMeasurement({
        chest: "",
        waist: "",
        hips: "",
        arms: "",
        thighs: ""
      });
      setShowAddForm(false);
      fetchMeasurements();
    } catch (error) {
      console.error("Error saving measurements:", error);
      toast.error("Failed to save measurements");
    }
  };

  const prepareChartData = () => {
    // Sort by date (ascending) for the chart
    return [...measurements]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(m => ({
        date: format(parseISO(m.recorded_at), "MMM d"),
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        arms: m.arms,
        thighs: m.thighs,
      }));
  };

  const getMostRecentMeasurements = (): BodyMeasurement | null => {
    if (measurements.length === 0) return null;
    return measurements[0];
  };

  const mostRecent = getMostRecentMeasurements();
  const chartData = prepareChartData();

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
                  <label htmlFor="chest" className="text-sm font-medium">
                    Chest (cm)
                  </label>
                  <Input
                    id="chest"
                    name="chest"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 100.5"
                    value={newMeasurement.chest}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="waist" className="text-sm font-medium">
                    Waist (cm)
                  </label>
                  <Input
                    id="waist"
                    name="waist"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 80.5"
                    value={newMeasurement.waist}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="hips" className="text-sm font-medium">
                    Hips (cm)
                  </label>
                  <Input
                    id="hips"
                    name="hips"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 95.0"
                    value={newMeasurement.hips}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="arms" className="text-sm font-medium">
                    Arms (cm)
                  </label>
                  <Input
                    id="arms"
                    name="arms"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 35.5"
                    value={newMeasurement.arms}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="thighs" className="text-sm font-medium">
                    Thighs (cm)
                  </label>
                  <Input
                    id="thighs"
                    name="thighs"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 55.0"
                    value={newMeasurement.thighs}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-2">
                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Measurements
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
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
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-right">Chest (cm)</th>
                      <th className="py-3 px-4 text-right">Waist (cm)</th>
                      <th className="py-3 px-4 text-right">Hips (cm)</th>
                      <th className="py-3 px-4 text-right">Arms (cm)</th>
                      <th className="py-3 px-4 text-right">Thighs (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((measurement) => (
                      <tr key={measurement.id} className="border-b">
                        <td className="py-3 px-4">
                          {format(parseISO(measurement.recorded_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-right">{measurement.chest || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.waist || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.hips || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.arms || "-"}</td>
                        <td className="py-3 px-4 text-right">{measurement.thighs || "-"}</td>
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