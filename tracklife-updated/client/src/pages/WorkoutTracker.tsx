import { useState, useEffect } from "react";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isWithinInterval, addDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Dumbbell, Download, Plus, Activity, CheckCircle, BarChart3 } from "lucide-react";
import { workoutStorage } from "@/lib/trackerStorage";
import { WorkoutEntry } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const WORKOUT_TYPES = [
  "Running",
  "Cycling",
  "Walking",
  "Swimming",
  "Yoga",
  "HIIT",
  "Weight Training",
  "Pilates",
  "Cardio",
  "CrossFit",
  "Boxing",
  "Other",
];

const COLORS = [
  "#4F46E5", // primary
  "#EC4899", // accent
  "#F59E0B", // warning
  "#10B981", // success
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#0EA5E9", // sky
  "#14B8A6", // teal
];

const WorkoutTracker = () => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("week");
  
  // Form state
  const [newEntry, setNewEntry] = useState<Partial<WorkoutEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "Running",
    duration: 30,
    intensity: "medium",
    calories: 250,
    notes: ""
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    weeklyWorkouts: 0,
    streak: 0
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = workoutStorage.getWorkoutEntries();
    setWorkoutEntries(entries);
    calculateStats(entries);
  };
  
  const calculateStats = (entries: WorkoutEntry[]) => {
    if (entries.length === 0) {
      setStats({
        totalWorkouts: 0,
        totalDuration: 0,
        totalCalories: 0,
        weeklyWorkouts: 0,
        streak: 0
      });
      return;
    }
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Total Stats
    const totalWorkouts = entries.length;
    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    
    // Weekly workouts
    const today = new Date();
    const startOfWeekDate = startOfWeek(today);
    const endOfWeekDate = endOfWeek(today);
    
    const weeklyWorkouts = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isWithinInterval(entryDate, {
        start: startOfWeekDate,
        end: endOfWeekDate
      });
    }).length;
    
    // Calculate streak
    let streak = 0;
    const uniqueDates = new Set(entries.map(entry => entry.date));
    let currentDate = new Date();
    
    // Check if there's a workout today
    if (uniqueDates.has(format(currentDate, "yyyy-MM-dd"))) {
      streak = 1;
      
      // Check previous days
      let previousDate = addDays(currentDate, -1);
      while (uniqueDates.has(format(previousDate, "yyyy-MM-dd"))) {
        streak++;
        previousDate = addDays(previousDate, -1);
      }
    } else {
      // Check if there was a workout yesterday and count backwards
      let previousDate = addDays(currentDate, -1);
      if (uniqueDates.has(format(previousDate, "yyyy-MM-dd"))) {
        streak = 1;
        previousDate = addDays(previousDate, -1);
        
        while (uniqueDates.has(format(previousDate, "yyyy-MM-dd"))) {
          streak++;
          previousDate = addDays(previousDate, -1);
        }
      }
    }
    
    setStats({
      totalWorkouts,
      totalDuration,
      totalCalories,
      weeklyWorkouts,
      streak
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entry: WorkoutEntry = {
      id: Date.now().toString(),
      date: newEntry.date || format(new Date(), "yyyy-MM-dd"),
      type: newEntry.type || "Running",
      duration: newEntry.duration || 30,
      intensity: newEntry.intensity as 'low' | 'medium' | 'high' || "medium",
      calories: newEntry.calories,
      notes: newEntry.notes
    };
    
    workoutStorage.addWorkoutEntry(entry);
    loadData();
    
    // Reset form to default values
    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "Running",
      duration: 30,
      intensity: "medium",
      calories: 250,
      notes: ""
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: name === "duration" || name === "calories" ? Number(value) : value
    }));
  };
  
  const handleIntensityChange = (value: string) => {
    setNewEntry(prev => ({ ...prev, intensity: value as 'low' | 'medium' | 'high' }));
  };
  
  const handleWorkoutTypeChange = (value: string) => {
    setNewEntry(prev => ({ ...prev, type: value }));
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (workoutEntries.length === 0) return [];
    
    const now = new Date();
    let dateRange: Date[];
    
    if (viewMode === "week") {
      const startDate = startOfWeek(now);
      const endDate = endOfWeek(now);
      dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === "month") {
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);
      dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      // Year view - simplified to just show last 12 months
      dateRange = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return startOfMonth(date);
      }).reverse();
    }
    
    return dateRange.map(date => {
      const formattedDate = viewMode === "year" 
        ? format(date, "MMM") 
        : format(date, "MMM dd");
      
      const entriesForDay = workoutEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return viewMode === "year"
          ? entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear()
          : isSameDay(entryDate, date);
      });
      
      const duration = entriesForDay.reduce((sum, entry) => sum + entry.duration, 0);
      const calories = entriesForDay.reduce((sum, entry) => sum + (entry.calories || 0), 0);
      
      return {
        date: formattedDate,
        duration,
        calories,
        count: entriesForDay.length
      };
    });
  };
  
  // Prepare workout type distribution data
  const getWorkoutDistributionData = () => {
    if (workoutEntries.length === 0) return [];
    
    const typeCount: { [key: string]: number } = {};
    
    workoutEntries.forEach(entry => {
      if (typeCount[entry.type]) {
        typeCount[entry.type]++;
      } else {
        typeCount[entry.type] = 1;
      }
    });
    
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };
  
  const chartData = getChartData();
  const distributionData = getWorkoutDistributionData();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-success text-2xl mr-3">
                <Dumbbell />
              </span>
              <CardTitle className="text-2xl">Workout Tracker</CardTitle>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-3">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Workout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workout Stats */}
            <div className="md:col-span-2">
              <Card className="bg-muted">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Workout Activity</h3>
                    <div className="flex space-x-2">
                      <Tabs defaultValue="week" value={viewMode}>
                        <TabsList>
                          <TabsTrigger 
                            value="week" 
                            onClick={() => setViewMode("week")}
                          >
                            Week
                          </TabsTrigger>
                          <TabsTrigger 
                            value="month" 
                            onClick={() => setViewMode("month")}
                          >
                            Month
                          </TabsTrigger>
                          <TabsTrigger 
                            value="year" 
                            onClick={() => setViewMode("year")}
                          >
                            Year
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="h-64">
                    {chartData.length > 0 && chartData.some(item => item.duration > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value} ${name === 'duration' ? 'min' : 'cal'}`, 
                              name === 'duration' ? 'Duration' : 'Calories'
                            ]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Legend />
                          <Bar 
                            name="Duration" 
                            dataKey="duration" 
                            fill="hsl(var(--success))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No workout data available. Add your first workout!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Workouts</p>
                    <p className="text-xl font-semibold">{stats.totalWorkouts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xl font-semibold">{stats.weeklyWorkouts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-xl font-semibold">{stats.streak} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-xl font-semibold">{stats.totalDuration} min</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Workout Distribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-2">
                    <h3 className="text-base font-semibold">Workout Types</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-48">
                      {distributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={1}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string, props: any) => [
                                `${value} workout${value !== 1 ? 's' : ''}`, 
                                props.payload.name
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))' 
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No workout data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-2">
                    <h3 className="text-base font-semibold">Recent Workouts</h3>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {workoutEntries.length > 0 ? (
                        [...workoutEntries]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map(entry => (
                            <div key={entry.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <div>
                                <p className="font-medium">{entry.type}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(entry.date), "MMM dd, yyyy")}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{entry.duration} min</p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.intensity.charAt(0).toUpperCase() + entry.intensity.slice(1)} intensity
                                </p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No recent workouts
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Entry Form */}
            <Card className="bg-muted">
              <CardHeader className="p-6 pb-2">
                <h3 className="text-lg font-semibold">Log Workout</h3>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <Label htmlFor="date" className="block text-sm font-medium mb-1">Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      className="w-full"
                      value={newEntry.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="workoutType" className="block text-sm font-medium mb-1">Workout Type</Label>
                    <Select
                      value={newEntry.type}
                      onValueChange={handleWorkoutTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKOUT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="duration" className="block text-sm font-medium mb-1">Duration (minutes)</Label>
                    <Input 
                      id="duration" 
                      name="duration" 
                      type="number" 
                      min="1"
                      className="w-full"
                      value={newEntry.duration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="intensity" className="block text-sm font-medium mb-1">Intensity</Label>
                    <Select
                      value={newEntry.intensity}
                      onValueChange={handleIntensityChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="calories" className="block text-sm font-medium mb-1">Calories Burned (optional)</Label>
                    <Input 
                      id="calories" 
                      name="calories" 
                      type="number" 
                      min="0"
                      className="w-full"
                      value={newEntry.calories}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (optional)</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      rows={3} 
                      placeholder="How was your workout?"
                      value={newEntry.notes}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Save Workout
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Insights */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-3">
                      <Activity className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Activity Trend</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        {stats.weeklyWorkouts >= 3 
                          ? "Great job staying active this week! Keep up the good work." 
                          : "Aim for at least 3-4 workouts per week for optimal fitness results."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-3">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">Workout Streak</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {stats.streak > 0 
                          ? `You're on a ${stats.streak} day workout streak! Great consistency!` 
                          : "Start a workout streak by exercising today!"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-500 dark:text-yellow-400 mr-3">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Workout Variety</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        {distributionData.length > 2 
                          ? "Good job mixing up your workout types! Variety helps prevent plateaus." 
                          : "Try incorporating different workout types for better overall fitness."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutTracker;
