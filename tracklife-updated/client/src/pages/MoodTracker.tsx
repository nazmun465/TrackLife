import { useState, useEffect } from "react";
import { format, parseISO, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, subMonths, differenceInDays, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smile, Download, Plus, Sun, Cloud, CloudRain, Zap, Coffee, Music, Book, Heart, Utensils, Users, Moon, ThumbsUp, ThumbsDown, Trash2, Edit, Info, BarChart as BarChartIcon, Activity } from "lucide-react";
import { moodStorage } from "@/lib/trackerStorage";
import { MoodEntry } from "@shared/schema";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const MOOD_LEVELS = [
  { value: 1, label: "Terrible", emoji: "😣", color: "#EF4444" },
  { value: 2, label: "Bad", emoji: "😞", color: "#F59E0B" },
  { value: 3, label: "Poor", emoji: "😕", color: "#F59E0B" },
  { value: 4, label: "Okay", emoji: "😐", color: "#F59E0B" },
  { value: 5, label: "Neutral", emoji: "😐", color: "#6366F1" },
  { value: 6, label: "Fine", emoji: "🙂", color: "#6366F1" },
  { value: 7, label: "Good", emoji: "😊", color: "#10B981" },
  { value: 8, label: "Great", emoji: "😄", color: "#10B981" },
  { value: 9, label: "Excellent", emoji: "😁", color: "#10B981" },
  { value: 10, label: "Amazing", emoji: "🤩", color: "#10B981" },
];

const ACTIVITIES = [
  { id: "exercise", label: "Exercise", icon: <Zap className="h-4 w-4" /> },
  { id: "work", label: "Work", icon: <Coffee className="h-4 w-4" /> },
  { id: "music", label: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "reading", label: "Reading", icon: <Book className="h-4 w-4" /> },
  { id: "date", label: "Date", icon: <Heart className="h-4 w-4" /> },
  { id: "food", label: "Good Food", icon: <Utensils className="h-4 w-4" /> },
  { id: "friends", label: "Friends", icon: <Users className="h-4 w-4" /> },
  { id: "sleep", label: "Good Sleep", icon: <Moon className="h-4 w-4" /> },
  { id: "outdoors", label: "Outdoors", icon: <Sun className="h-4 w-4" /> },
  { id: "meditation", label: "Meditation", icon: <Moon className="h-4 w-4" /> },
];

// Colors for charts
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#6366F1"];

const MoodTracker = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("month");
  
  // Form state
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<MoodEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    mood: 5,
    activities: [],
    notes: ""
  });
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    averageMood: 0,
    todayMood: null as number | null,
    weekTrend: 0,
    topActivities: [] as Array<{activity: string, count: number}>
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = moodStorage.getMoodEntries();
    setMoodEntries(entries);
    calculateStats(entries);
  };
  
  const calculateStats = (entries: MoodEntry[]) => {
    if (entries.length === 0) {
      setStats({
        averageMood: 0,
        todayMood: null,
        weekTrend: 0,
        topActivities: []
      });
      return;
    }
    
    // Calculate average mood
    const totalMood = entries.reduce((sum, entry) => sum + entry.mood, 0);
    const averageMood = Math.round((totalMood / entries.length) * 10) / 10;
    
    // Get today's mood
    const today = new Date();
    const todayEntry = entries.find(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, today);
    });
    
    // Calculate week trend
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return differenceInDays(today, entryDate) <= 7;
    });
    
    const prevWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const diff = differenceInDays(today, entryDate);
      return diff > 7 && diff <= 14;
    });
    
    let weekTrend = 0;
    
    if (weekEntries.length > 0 && prevWeekEntries.length > 0) {
      const weekAvg = weekEntries.reduce((sum, entry) => sum + entry.mood, 0) / weekEntries.length;
      const prevWeekAvg = prevWeekEntries.reduce((sum, entry) => sum + entry.mood, 0) / prevWeekEntries.length;
      weekTrend = Math.round((weekAvg - prevWeekAvg) * 10) / 10;
    }
    
    // Get top activities
    const activityCounts: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          if (activityCounts[activity]) {
            activityCounts[activity]++;
          } else {
            activityCounts[activity] = 1;
          }
        });
      }
    });
    
    const topActivities = Object.entries(activityCounts)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setStats({
      averageMood,
      todayMood: todayEntry ? todayEntry.mood : null,
      weekTrend,
      topActivities
    });
  };
  
  const handleSubmit = () => {
    if (newEntry.mood === undefined) return;
    
    const entry: MoodEntry = {
      id: editId || Date.now().toString(),
      date: newEntry.date || format(new Date(), "yyyy-MM-dd"),
      mood: newEntry.mood,
      activities: newEntry.activities || [],
      notes: newEntry.notes
    };
    
    if (editMode && editId) {
      moodStorage.updateMoodEntry(editId, entry);
      setEditMode(false);
      setEditId(null);
    } else {
      moodStorage.addMoodEntry(entry);
    }
    
    resetForm();
    setShowMoodDialog(false);
    loadData();
  };
  
  const handleEditEntry = (entry: MoodEntry) => {
    setNewEntry(entry);
    setEditMode(true);
    setEditId(entry.id);
    setShowMoodDialog(true);
  };
  
  const handleDeleteEntry = (id: string) => {
    moodStorage.deleteMoodEntry(id);
    loadData();
  };
  
  const resetForm = () => {
    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      mood: 5,
      activities: [],
      notes: ""
    });
    setEditMode(false);
    setEditId(null);
  };
  
  const toggleActivity = (activityId: string) => {
    setNewEntry(prev => {
      const currentActivities = prev.activities || [];
      return {
        ...prev,
        activities: currentActivities.includes(activityId)
          ? currentActivities.filter(id => id !== activityId)
          : [...currentActivities, activityId]
      };
    });
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (moodEntries.length === 0) return [];
    
    const now = new Date();
    let dateRange: Date[];
    let format_string = "MMM dd";
    
    if (viewMode === "week") {
      // Last 7 days
      dateRange = Array.from({ length: 7 }).map((_, i) => addDays(now, -6 + i));
    } else if (viewMode === "month") {
      // Current month
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      dateRange = eachDayOfInterval({ start, end });
    } else {
      // Year - by month
      dateRange = Array.from({ length: 12 }).map((_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return date;
      });
      format_string = "MMM";
    }
    
    return dateRange.map(date => {
      let moodsForDate: number[] = [];
      
      if (viewMode === "year") {
        // For year view, get all moods in the month
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        moodsForDate = moodEntries
          .filter(entry => {
            const entryDate = new Date(entry.date);
            return isWithinInterval(entryDate, {
              start: monthStart,
              end: monthEnd
            });
          })
          .map(entry => entry.mood);
        
      } else {
        // For week and month views, get mood for the specific day
        moodsForDate = moodEntries
          .filter(entry => isSameDay(new Date(entry.date), date))
          .map(entry => entry.mood);
      }
      
      const avgMood = moodsForDate.length > 0
        ? moodsForDate.reduce((sum, mood) => sum + mood, 0) / moodsForDate.length
        : null;
      
      return {
        date: format(date, format_string),
        mood: avgMood,
        hasData: avgMood !== null
      };
    });
  };
  
  // Get mood distribution data
  const getMoodDistributionData = () => {
    const distribution = Array(10).fill(0);
    
    moodEntries.forEach(entry => {
      distribution[entry.mood - 1]++;
    });
    
    return distribution.map((count, index) => ({
      mood: index + 1,
      count,
      label: MOOD_LEVELS[index].label
    }));
  };
  
  // Get activity correlation with mood
  const getActivityMoodCorrelation = () => {
    const correlation: { [key: string]: { count: number, totalMood: number } } = {};
    
    moodEntries.forEach(entry => {
      if (entry.activities && entry.activities.length > 0) {
        entry.activities.forEach(activity => {
          if (!correlation[activity]) {
            correlation[activity] = { count: 0, totalMood: 0 };
          }
          correlation[activity].count++;
          correlation[activity].totalMood += entry.mood;
        });
      }
    });
    
    return Object.entries(correlation)
      .map(([activity, data]) => ({
        activity,
        averageMood: Math.round((data.totalMood / data.count) * 10) / 10,
        count: data.count
      }))
      .filter(item => item.count >= 3) // Only include activities with enough data
      .sort((a, b) => b.averageMood - a.averageMood)
      .slice(0, 5); // Top 5 activities by mood
  };
  
  // Calendar day renderer
  const dayRenderer = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    const entryForDay = moodEntries.find(entry => entry.date === formattedDay);
    
    let className = "relative h-9 w-9 p-0 flex items-center justify-center";
    
    if (entryForDay) {
      const moodLevel = MOOD_LEVELS.find(level => level.value === entryForDay.mood);
      if (moodLevel) {
        className += ` bg-opacity-50 text-white`; 
        className += ` bg-[${moodLevel.color}]`;
      }
    }
    
    return className;
  };
  
  const getMoodColor = (mood: number) => {
    const moodLevel = MOOD_LEVELS.find(level => level.value === mood);
    return moodLevel ? moodLevel.color : '#6366F1';
  };
  
  const getMoodEmoji = (mood: number | null) => {
    if (mood === null) return "❓";
    const moodLevel = MOOD_LEVELS.find(level => level.value === mood);
    return moodLevel ? moodLevel.emoji : "😐";
  };
  
  const getMoodLabel = (mood: number | null) => {
    if (mood === null) return "Not recorded";
    const moodLevel = MOOD_LEVELS.find(level => level.value === mood);
    return moodLevel ? moodLevel.label : "Neutral";
  };
  
  const chartData = getChartData();
  const moodDistribution = getMoodDistributionData();
  const activityCorrelation = getActivityMoodCorrelation();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-accent text-2xl mr-3">
                <Smile />
              </span>
              <CardTitle className="text-2xl">Mood Tracker</CardTitle>
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
                  setShowMoodDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Mood
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mood Overview */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Today's Mood</p>
                    <div className="flex items-center mt-1">
                      <span className="text-3xl mr-2">{getMoodEmoji(stats.todayMood)}</span>
                      <div>
                        <p className="text-xl font-bold">
                          {stats.todayMood ? getMoodLabel(stats.todayMood) : 'Not recorded'}
                        </p>
                        {stats.todayMood && <p className="text-xs text-muted-foreground">{stats.todayMood}/10</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Average Mood</p>
                    <p className="text-xl font-bold">{stats.averageMood ? stats.averageMood.toFixed(1) : 'N/A'}/10</p>
                    <p className="text-xs text-muted-foreground mt-1">Overall average</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Weekly Trend</p>
                    <div className="flex items-center">
                      <p className="text-xl font-bold">{stats.weekTrend > 0 ? '+' : ''}{stats.weekTrend.toFixed(1)}</p>
                      {stats.weekTrend !== 0 && (
                        <span className={`ml-2 ${stats.weekTrend > 0 ? 'text-success' : 'text-destructive'}`}>
                          {stats.weekTrend > 0 ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">From previous week</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Mood Chart */}
              <Card className="bg-muted mb-6">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Mood Trends</h3>
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
                    {chartData.some(d => d.hasData) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            domain={[0, 10]} 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            ticks={[0, 2, 4, 6, 8, 10]}
                          />
                          <Tooltip 
                            formatter={(value: any) => [value !== null ? `${value}/10` : 'No data', 'Mood']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="mood" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No mood data available. Add your first mood entry!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Mood Analysis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-0">
                    <h3 className="text-base font-semibold">Mood Distribution</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-48">
                      {moodEntries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={moodDistribution}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                            <XAxis 
                              dataKey="mood" 
                              tick={{ fontSize: 10 }} 
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 10 }} 
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip 
                              formatter={(value: number, name: string, props: any) => [
                                `${value} time${value !== 1 ? 's' : ''}`, 
                                props.payload.label
                              ]}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))' 
                              }} 
                            />
                            <Bar 
                              dataKey="count" 
                              fill="hsl(var(--accent))" 
                              radius={[4, 4, 0, 0]} 
                              barSize={15}
                            />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No mood data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-0">
                    <h3 className="text-base font-semibold">Activities & Mood</h3>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {activityCorrelation.length > 0 ? (
                      <div className="space-y-3">
                        {activityCorrelation.map((item, index) => {
                          const activity = ACTIVITIES.find(a => a.id === item.activity);
                          return (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-2">
                                  {activity ? activity.icon : <Activity className="h-4 w-4" />}
                                </div>
                                <span className="text-sm font-medium">{activity ? activity.label : item.activity}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium mr-2">{item.averageMood.toFixed(1)}</span>
                                <span className="text-xl">{getMoodEmoji(Math.round(item.averageMood))}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-36 text-muted-foreground">
                        <div className="text-center">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p>Track activities with your mood to see correlations</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Calendar & Mood Entry */}
            <div>
              <Card className="mb-6">
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Mood Calendar</h3>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    classNames={{
                      day: (day) => {
                        const formattedDay = format(day, "yyyy-MM-dd");
                        const entryForDay = moodEntries.find(entry => entry.date === formattedDay);
                        
                        if (!entryForDay) return "";
                        
                        const moodLevel = MOOD_LEVELS.find(level => level.value === entryForDay.mood);
                        return `bg-[${moodLevel?.color}] bg-opacity-30 hover:bg-opacity-50`;
                      }
                    }}
                  />
                  
                  {/* Selected Day Mood */}
                  {(() => {
                    const formattedDay = format(selectedDate, "yyyy-MM-dd");
                    const entryForDay = moodEntries.find(entry => entry.date === formattedDay);
                    
                    return (
                      <div className="mt-4 p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{format(selectedDate, "MMMM d, yyyy")}</h4>
                          <div className="flex space-x-1">
                            {entryForDay && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7"
                                  onClick={() => handleEditEntry(entryForDay)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteEntry(entryForDay.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {!entryForDay && isSameDay(selectedDate, new Date()) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  resetForm();
                                  setShowMoodDialog(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Mood
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {entryForDay ? (
                          <div className="mt-2">
                            <div className="flex items-center">
                              <span className="text-3xl mr-2">{getMoodEmoji(entryForDay.mood)}</span>
                              <div>
                                <p className="font-medium">{getMoodLabel(entryForDay.mood)}</p>
                                <p className="text-xs text-muted-foreground">{entryForDay.mood}/10</p>
                              </div>
                            </div>
                            
                            {entryForDay.activities && entryForDay.activities.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium mb-1">Activities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {entryForDay.activities.map(activityId => {
                                    const activity = ACTIVITIES.find(a => a.id === activityId);
                                    return activity ? (
                                      <div key={activityId} className="flex items-center bg-muted px-2 py-1 rounded-full text-xs">
                                        {activity.icon}
                                        <span className="ml-1">{activity.label}</span>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {entryForDay.notes && (
                              <div className="mt-3">
                                <p className="text-xs font-medium mb-1">Notes:</p>
                                <p className="text-sm text-muted-foreground">{entryForDay.notes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 text-center py-4 text-muted-foreground">
                            <Smile className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No mood recorded for this day</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
              
              {/* Mood Tips */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Mood Boosters</h3>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Sun className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Sunshine & Outdoors</h4>
                        <p className="text-xs text-muted-foreground mt-1">Spending time outdoors and in the sun can boost serotonin and improve mood.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Regular Exercise</h4>
                        <p className="text-xs text-muted-foreground mt-1">Physical activity releases endorphins, which can significantly improve your mood.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Social Connection</h4>
                        <p className="text-xs text-muted-foreground mt-1">Spending time with friends and loved ones can boost your sense of well-being.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Insights */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-3">
                      <Info className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Mood Patterns</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        {moodEntries.length > 10 
                          ? `Your average mood is ${stats.averageMood.toFixed(1)}/10. You tend to feel best on days with ${activityCorrelation[0]?.activity ? ACTIVITIES.find(a => a.id === activityCorrelation[0].activity)?.label || activityCorrelation[0].activity : "certain activities"}.` 
                          : "Track your mood regularly to identify patterns and triggers that affect how you feel."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-500 dark:text-yellow-400 mr-3">
                      <Activity className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Activity Impact</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        {activityCorrelation.length > 0 
                          ? `Activities like ${activityCorrelation.slice(0, 2).map(a => ACTIVITIES.find(act => act.id === a.activity)?.label || a.activity).join(" and ")} seem to boost your mood the most.` 
                          : "Log activities along with your mood to discover what has the most positive impact on your wellbeing."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-3">
                      <BarChartIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">Mood Trend</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {stats.weekTrend !== 0 
                          ? `Your mood has ${stats.weekTrend > 0 ? 'improved' : 'decreased'} by ${Math.abs(stats.weekTrend).toFixed(1)} points compared to last week. ${stats.weekTrend > 0 ? 'Keep up what you\'re doing!' : 'Consider trying some mood-boosting activities.'}` 
                          : "Your mood has been steady recently. Consistency is good for mental wellbeing."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Mood Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Mood Entry" : "Add New Mood Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="moodDate">Date</Label>
              <Input 
                id="moodDate" 
                type="date" 
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="moodLevel">How are you feeling? ({newEntry.mood}/10)</Label>
                <span className="text-2xl">{getMoodEmoji(newEntry.mood || 5)}</span>
              </div>
              <Slider 
                id="moodLevel"
                min={1} 
                max={10} 
                step={1}
                value={[newEntry.mood || 5]}
                onValueChange={(values) => setNewEntry(prev => ({ ...prev, mood: values[0] }))}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Terrible</span>
                <span>Neutral</span>
                <span>Amazing</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Activities (Optional)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {ACTIVITIES.map(activity => (
                  <button
                    key={activity.id}
                    type="button"
                    className={`flex items-center px-3 py-2 text-xs rounded-md border ${
                      newEntry.activities?.includes(activity.id) 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-muted bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                    onClick={() => toggleActivity(activity.id)}
                  >
                    {activity.icon}
                    <span className="ml-1">{activity.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moodNotes">Notes (Optional)</Label>
              <Textarea 
                id="moodNotes" 
                placeholder="How are you feeling today? What happened?" 
                value={newEntry.notes || ""}
                onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setShowMoodDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={newEntry.mood === undefined}
            >
              {editMode ? "Save Changes" : "Save Mood"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodTracker;
