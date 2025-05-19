import { useState, useEffect } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, subMonths, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Droplet, Download, Plus, Trash2, Edit, BarChart3, Activity, Clock } from "lucide-react";
import { waterStorage } from "@/lib/trackerStorage";
import { WaterEntry } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];

const WaterTracker = () => {
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<WaterEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 1,
    timestamp: format(new Date(), "HH:mm")
  });
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    dailyGoal: 8, // 8 glasses as default
    todayAmount: 0,
    weeklyAverage: 0,
    completion: 0,
    streak: 0
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = waterStorage.getWaterEntries();
    setWaterEntries(entries);
    calculateStats(entries);
  };
  
  const calculateStats = (entries: WaterEntry[]) => {
    if (entries.length === 0) {
      setStats({
        dailyGoal: 8,
        todayAmount: 0,
        weeklyAverage: 0,
        completion: 0,
        streak: 0
      });
      return;
    }
    
    // Calculate today's total
    const today = format(new Date(), "yyyy-MM-dd");
    const todayEntries = entries.filter(entry => entry.date === today);
    const todayAmount = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Calculate weekly average (last 7 days)
    const now = new Date();
    const lastWeek = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - 6 + i);
      return format(date, "yyyy-MM-dd");
    });
    
    const weeklyData = lastWeek.map(date => {
      const dayEntries = entries.filter(entry => entry.date === date);
      return dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    });
    
    const weeklyAverage = weeklyData.reduce((sum, amount) => sum + amount, 0) / 7;
    
    // Calculate completion percentage
    const dailyGoal = 8; // Default goal: 8 glasses
    const completion = Math.min(100, Math.round((todayAmount / dailyGoal) * 100));
    
    // Calculate streak
    let streak = 0;
    const uniqueDates = new Set(entries.map(entry => entry.date));
    
    // Check if there's water logged today
    if (uniqueDates.has(today)) {
      streak = 1;
      
      // Check previous days
      let currentDate = new Date();
      let checkDate;
      
      do {
        currentDate.setDate(currentDate.getDate() - 1);
        checkDate = format(currentDate, "yyyy-MM-dd");
        
        if (uniqueDates.has(checkDate)) {
          streak++;
        } else {
          break;
        }
      } while (true);
    }
    
    setStats({
      dailyGoal,
      todayAmount,
      weeklyAverage,
      completion,
      streak
    });
  };
  
  const handleSubmit = () => {
    if (!newEntry.amount) return;
    
    const entry: WaterEntry = {
      id: editId || Date.now().toString(),
      date: newEntry.date || format(new Date(), "yyyy-MM-dd"),
      amount: newEntry.amount,
      timestamp: newEntry.timestamp || format(new Date(), "HH:mm")
    };
    
    if (editMode && editId) {
      waterStorage.updateWaterEntry(editId, entry);
      setEditMode(false);
      setEditId(null);
    } else {
      waterStorage.addWaterEntry(entry);
    }
    
    resetForm();
    setShowAddDialog(false);
    loadData();
  };
  
  const handleEditEntry = (entry: WaterEntry) => {
    setNewEntry(entry);
    setEditMode(true);
    setEditId(entry.id);
    setShowAddDialog(true);
  };
  
  const handleDeleteEntry = (id: string) => {
    waterStorage.deleteWaterEntry(id);
    loadData();
  };
  
  const resetForm = () => {
    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 1,
      timestamp: format(new Date(), "HH:mm")
    });
    setEditMode(false);
    setEditId(null);
  };
  
  // Quick add buttons
  const quickAdd = (amount: number) => {
    const entry: WaterEntry = {
      id: Date.now().toString(),
      date: format(new Date(), "yyyy-MM-dd"),
      amount,
      timestamp: format(new Date(), "HH:mm")
    };
    
    waterStorage.addWaterEntry(entry);
    loadData();
  };
  
  // Get chart data
  const getChartData = () => {
    if (waterEntries.length === 0) return [];
    
    const now = new Date();
    
    if (viewMode === "day") {
      // Group by hour for today
      const today = format(now, "yyyy-MM-dd");
      const todayEntries = waterEntries.filter(entry => entry.date === today);
      
      const hourlyData: { [key: string]: number } = {};
      
      // Initialize hours
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        hourlyData[hour] = 0;
      }
      
      // Fill with data
      todayEntries.forEach(entry => {
        if (entry.timestamp) {
          const hour = entry.timestamp.split(':')[0];
          hourlyData[hour] = (hourlyData[hour] || 0) + entry.amount;
        }
      });
      
      return Object.entries(hourlyData).map(([hour, amount]) => ({
        time: `${hour}:00`,
        amount
      }));
      
    } else if (viewMode === "week") {
      // Last 7 days
      return Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - 6 + i);
        const formattedDate = format(date, "yyyy-MM-dd");
        const dayName = format(date, "EEE");
        
        const dayEntries = waterEntries.filter(entry => entry.date === formattedDate);
        const total = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
        
        return {
          day: dayName,
          amount: total,
          isToday: i === 6
        };
      });
      
    } else {
      // Month view - last 30 days
      return Array.from({ length: 30 }).map((_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - 29 + i);
        const formattedDate = format(date, "yyyy-MM-dd");
        const dayName = format(date, "MMM d");
        
        const dayEntries = waterEntries.filter(entry => entry.date === formattedDate);
        const total = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
        
        return {
          day: dayName,
          amount: total,
          isToday: i === 29
        };
      });
    }
  };
  
  const chartData = getChartData();
  
  // Get today's entries
  const getTodayEntries = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return waterEntries
      .filter(entry => entry.date === today)
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp.localeCompare(a.timestamp);
      });
  };
  
  const todayEntries = getTodayEntries();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-primary text-2xl mr-3">
                <Droplet />
              </span>
              <CardTitle className="text-2xl">Water Tracker</CardTitle>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-3">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                className="flex items-center"
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Water
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Water Overview */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Today's Progress</p>
                    <div className="flex items-center mt-1">
                      <p className="text-2xl font-bold mr-2">{stats.todayAmount}</p>
                      <div className="text-sm text-muted-foreground">of {stats.dailyGoal} glasses</div>
                    </div>
                    <Progress value={stats.completion} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Weekly Average</p>
                    <p className="text-2xl font-bold">{stats.weeklyAverage.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">glasses per day</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{stats.streak}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.streak === 1 ? 'day' : 'days'} in a row
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Water Intake Chart */}
              <Card className="bg-muted mb-6">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Water Intake</h3>
                    <div className="flex space-x-2">
                      <Tabs defaultValue="day" value={viewMode}>
                        <TabsList>
                          <TabsTrigger 
                            value="day" 
                            onClick={() => setViewMode("day")}
                          >
                            Today
                          </TabsTrigger>
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
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="h-64">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                          <XAxis 
                            dataKey={viewMode === "day" ? "time" : "day"} 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            interval={viewMode === "day" ? 2 : 0}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Glasses', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value} glasses`, 'Water Intake']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Bar 
                            dataKey="amount" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={viewMode === "month" ? 8 : 24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No water data available. Start tracking your water intake!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Add Section */}
              <Card className="bg-card mb-6">
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Quick Add</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => quickAdd(0.5)}
                    >
                      <Droplet className="h-4 w-4 mr-2 text-primary" />
                      0.5 Glass
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => quickAdd(1)}
                    >
                      <Droplet className="h-4 w-4 mr-2 text-primary" />
                      1 Glass
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => quickAdd(2)}
                    >
                      <Droplet className="h-4 w-4 mr-2 text-primary" />
                      2 Glasses
                    </Button>
                    <Button 
                      onClick={() => {
                        resetForm();
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Custom
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Today's Log */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Today's Log</h3>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        resetForm();
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {todayEntries.length > 0 ? (
                    <div className="space-y-3">
                      {todayEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex items-center">
                            <div className="bg-primary/10 p-2 rounded-md">
                              <Droplet className="h-4 w-4 text-primary" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">{entry.amount} {entry.amount === 1 ? 'glass' : 'glasses'}</p>
                              <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditEntry(entry)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Droplet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <h3 className="text-lg font-medium mb-1">No entries yet</h3>
                      <p className="text-sm mb-4">Start tracking your water intake for today.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setShowAddDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Entry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Add Water Dialog */}
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editMode ? 'Edit Water Entry' : 'Add Water'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEntry.date}
                          onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newEntry.timestamp}
                          onChange={(e) => setNewEntry({...newEntry, timestamp: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="amount">
                        Amount (glasses): {newEntry.amount}
                      </Label>
                      <div className="flex items-center space-x-4 py-2">
                        <Button 
                          variant="outline" 
                          type="button" 
                          size="icon"
                          onClick={() => setNewEntry({...newEntry, amount: Math.max(0.5, (newEntry.amount || 1) - 0.5)})}
                        >
                          -
                        </Button>
                        <Slider
                          id="amount"
                          min={0.5}
                          max={5}
                          step={0.5}
                          value={[newEntry.amount || 1]}
                          onValueChange={(value) => setNewEntry({...newEntry, amount: value[0]})}
                        />
                        <Button 
                          variant="outline" 
                          type="button" 
                          size="icon"
                          onClick={() => setNewEntry({...newEntry, amount: Math.min(5, (newEntry.amount || 1) + 0.5)})}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editMode ? 'Update' : 'Add Entry'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Hydration Tips */}
              <Card className="mt-4 bg-primary/5">
                <CardHeader className="p-4 pb-0">
                  <h3 className="text-base font-semibold">Hydration Tips</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      Drink a glass of water first thing in the morning
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      Carry a reusable water bottle with you
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      Set reminders every hour to drink water
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      Drink a glass before each meal
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterTracker;