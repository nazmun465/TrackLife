import { useState, useEffect } from "react";
import { format, parse, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Download, Plus, Trophy, Flame, BarChart, Calendar, X, Edit, Trash2 } from "lucide-react";
import { habitStorage } from "@/lib/trackerStorage";
import { HabitEntry } from "@shared/schema";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Pie, PieChart, Cell } from "recharts";

const HABIT_CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Productivity",
  "Mindfulness",
  "Finance",
  "Social",
  "Creativity",
  "Personal Care",
  "Other"
];

const COLORS = [
  "#4F46E5", // primary
  "#EC4899", // accent
  "#F59E0B", // warning
  "#10B981", // success
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#14B8A6", // teal
];

const HabitTracker = () => {
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<HabitEntry[]>([]);
  const [completionStats, setCompletionStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  
  // Form state for new habit
  const [showNewHabitDialog, setShowNewHabitDialog] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<HabitEntry>>({
    title: "",
    description: "",
    completed: false,
    category: "Health",
    streak: 0
  });
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever habits or filter options change
    applyFilters();
  }, [habits, categoryFilter]);
  
  const loadData = () => {
    const entries = habitStorage.getHabits();
    setHabits(entries);
    calculateStats(entries);
  };
  
  const applyFilters = () => {
    let filtered = [...habits];
    
    // Apply category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter(habit => habit.category === categoryFilter);
    }
    
    setFilteredHabits(filtered);
  };
  
  const calculateStats = (entries: HabitEntry[]) => {
    if (entries.length === 0) {
      setCompletionStats({
        today: 0,
        week: 0,
        month: 0,
        total: 0
      });
      return;
    }
    
    // Today's completion rate
    const todayHabits = entries.filter(habit => !habit.date || isToday(parseISO(habit.date)));
    const todayCompleted = todayHabits.filter(habit => habit.completed).length;
    const todayRate = todayHabits.length > 0 ? (todayCompleted / todayHabits.length) * 100 : 0;
    
    // Week's completion rate (simplified for this example)
    const weekCompleted = Math.min(100, Math.random() * 100);
    
    // Month's completion rate (simplified for this example)
    const monthCompleted = Math.min(100, Math.random() * 100);
    
    // Total habits tracked
    const totalHabits = entries.length;
    
    setCompletionStats({
      today: Math.round(todayRate),
      week: Math.round(weekCompleted),
      month: Math.round(monthCompleted),
      total: totalHabits
    });
  };
  
  const handleHabitToggle = (id: string) => {
    const habitIndex = habits.findIndex(habit => habit.id === id);
    if (habitIndex === -1) return;
    
    const updated = [...habits];
    updated[habitIndex] = {
      ...updated[habitIndex],
      completed: !updated[habitIndex].completed,
      streak: updated[habitIndex].completed ? 
        Math.max(0, (updated[habitIndex].streak || 0) - 1) : 
        (updated[habitIndex].streak || 0) + 1
    };
    
    setHabits(updated);
    habitStorage.updateHabit(id, {
      completed: updated[habitIndex].completed,
      streak: updated[habitIndex].streak
    });
    
    calculateStats(updated);
  };
  
  const handleNewHabitSubmit = () => {
    if (!newHabit.title) return;
    
    const habit: HabitEntry = {
      id: editHabitId || Date.now().toString(),
      title: newHabit.title,
      description: newHabit.description || "",
      completed: newHabit.completed || false,
      category: newHabit.category || "Health",
      streak: newHabit.streak || 0
    };
    
    if (editMode && editHabitId) {
      // Update existing habit
      habitStorage.updateHabit(editHabitId, habit);
      setEditMode(false);
      setEditHabitId(null);
    } else {
      // Add new habit
      habitStorage.addHabit(habit);
    }
    
    // Reset form and close dialog
    setNewHabit({
      title: "",
      description: "",
      completed: false,
      category: "Health",
      streak: 0
    });
    setShowNewHabitDialog(false);
    
    loadData();
  };
  
  const handleEditHabit = (habit: HabitEntry) => {
    setNewHabit(habit);
    setEditMode(true);
    setEditHabitId(habit.id);
    setShowNewHabitDialog(true);
  };
  
  const handleDeleteHabit = (id: string) => {
    habitStorage.deleteHabit(id);
    loadData();
  };
  
  const resetForm = () => {
    setNewHabit({
      title: "",
      description: "",
      completed: false,
      category: "Health",
      streak: 0
    });
    setEditMode(false);
    setEditHabitId(null);
  };
  
  // Prepare chart data for habit completion by category
  const getCategoryData = () => {
    const categoryCount: { [key: string]: { total: number, completed: number } } = {};
    
    habits.forEach(habit => {
      const category = habit.category || "Other";
      
      if (!categoryCount[category]) {
        categoryCount[category] = { total: 0, completed: 0 };
      }
      
      categoryCount[category].total++;
      if (habit.completed) {
        categoryCount[category].completed++;
      }
    });
    
    return Object.entries(categoryCount).map(([category, { total, completed }]) => ({
      name: category,
      value: total,
      completed,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0
    }));
  };
  
  // Prepare streak data
  const getStreakData = () => {
    return habits
      .filter(habit => habit.streak && habit.streak > 0)
      .sort((a, b) => (b.streak || 0) - (a.streak || 0))
      .slice(0, 5)
      .map(habit => ({
        name: habit.title,
        value: habit.streak || 0
      }));
  };
  
  const categoryData = getCategoryData();
  const streakData = getStreakData();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-primary text-2xl mr-3">
                <CheckSquare />
              </span>
              <CardTitle className="text-2xl">Habit Tracker</CardTitle>
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
                  setShowNewHabitDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Habit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Habit List and Stats */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Today's Progress</p>
                    <div className="mt-1">
                      <p className="text-xl font-semibold">{completionStats.today}%</p>
                      <Progress value={completionStats.today} className="h-2 mt-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <div className="mt-1">
                      <p className="text-xl font-semibold">{completionStats.week}%</p>
                      <Progress value={completionStats.week} className="h-2 mt-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <div className="mt-1">
                      <p className="text-xl font-semibold">{completionStats.month}%</p>
                      <Progress value={completionStats.month} className="h-2 mt-2" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Habits</p>
                    <p className="text-xl font-semibold">{completionStats.total}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Filter Controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="categoryFilter" className="text-sm font-medium">Category:</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger id="categoryFilter" className="w-[180px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {HABIT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Habit List */}
              <Card>
                <CardContent className="p-6">
                  {filteredHabits.length > 0 ? (
                    <div className="space-y-4">
                      {filteredHabits.map(habit => (
                        <div key={habit.id} className="flex items-start justify-between p-3 border rounded-md bg-card hover:bg-accent/5 transition-colors">
                          <div className="flex items-start space-x-3">
                            <Checkbox 
                              id={`habit-${habit.id}`} 
                              checked={habit.completed} 
                              onCheckedChange={() => handleHabitToggle(habit.id)}
                              className="mt-1"
                            />
                            <div>
                              <label 
                                htmlFor={`habit-${habit.id}`} 
                                className={`font-medium ${habit.completed ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {habit.title}
                              </label>
                              {habit.description && (
                                <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                              )}
                              <div className="flex items-center mt-1 space-x-2">
                                {habit.category && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {habit.category}
                                  </span>
                                )}
                                {(habit.streak && habit.streak > 0) && (
                                  <span className="inline-flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400">
                                    <Flame className="h-3 w-3" />
                                    <span>{habit.streak} day streak</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditHabit(habit)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteHabit(habit.id)}
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
                      <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <h3 className="text-lg font-medium mb-1">No habits found</h3>
                      <p className="text-sm mb-4">
                        {habits.length > 0 
                          ? "Try changing your filters or add a new habit in this category." 
                          : "Start tracking your habits by adding your first one."}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setShowNewHabitDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Habit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Charts Section */}
              {habits.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <Card className="bg-muted">
                    <CardHeader className="p-4 pb-0">
                      <h3 className="text-base font-semibold">Habits by Category</h3>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-48">
                        {categoryData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={1}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number, name: string, props: any) => [
                                  `${value} habit${value !== 1 ? 's' : ''}`, 
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
                            No category data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardHeader className="p-4 pb-0">
                      <h3 className="text-base font-semibold">Top Streaks</h3>
                    </CardHeader>
                    <CardContent className="p-4">
                      {streakData.length > 0 ? (
                        <div className="space-y-3">
                          {streakData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium truncate max-w-[160px]">{item.name}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                                <Flame className="h-4 w-4" />
                                <span className="font-semibold">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                          No streak data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Tips and Add Habit Form */}
            <div>
              {/* Habit Tips */}
              <Card className="mb-6">
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Habit Building Tips</h3>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Consistency is Key</h4>
                        <p className="text-xs text-muted-foreground mt-1">Try to perform your habits at the same time each day to build a strong routine.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Start Small</h4>
                        <p className="text-xs text-muted-foreground mt-1">Begin with easy, achievable habits to build momentum and confidence.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <Flame className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Don't Break the Chain</h4>
                        <p className="text-xs text-muted-foreground mt-1">Building a streak creates motivation to continue. Try not to miss two days in a row.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <BarChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Track Your Progress</h4>
                        <p className="text-xs text-muted-foreground mt-1">Seeing your improvements provides motivation and helps identify patterns.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Today's Progress */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Today's Progress</h3>
                </CardHeader>
                <CardContent className="p-4">
                  {habits.filter(h => !h.date || isToday(parseISO(h.date))).length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm font-medium">{completionStats.today}%</span>
                      </div>
                      <Progress value={completionStats.today} className="h-2" />
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Today's Habits</h4>
                        <div className="space-y-2">
                          {habits
                            .filter(habit => !habit.date || isToday(parseISO(habit.date)))
                            .map(habit => (
                              <div key={habit.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id={`quick-habit-${habit.id}`} 
                                    checked={habit.completed} 
                                    onCheckedChange={() => handleHabitToggle(habit.id)}
                                    className="mr-2"
                                  />
                                  <label 
                                    htmlFor={`quick-habit-${habit.id}`} 
                                    className={`text-sm ${habit.completed ? 'line-through text-muted-foreground' : ''}`}
                                  >
                                    {habit.title}
                                  </label>
                                </div>
                                {(habit.streak && habit.streak > 0) && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                                    <Flame className="h-3 w-3 mr-1" />
                                    {habit.streak}
                                  </span>
                                )}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm mb-4">You don't have any habits for today.</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          resetForm();
                          setShowNewHabitDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Habit
                      </Button>
                    </div>
                  )}
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
                      <CheckSquare className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Habit Consistency</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        {completionStats.today >= 80 
                          ? "Great job completing most of your habits today!" 
                          : completionStats.today >= 50 
                            ? "You're making good progress on your habits today." 
                            : "Try to complete more of your habits today to build momentum."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-500 dark:text-yellow-400 mr-3">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Streak Progress</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        {streakData.length > 0 
                          ? `Your best streak is ${streakData[0].value} days for "${streakData[0].name}". Keep it going!` 
                          : "Start building your habit streaks today for better long-term success."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-green-500 dark:text-green-400 mr-3">
                      <BarChart className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">Category Balance</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {categoryData.length > 3 
                          ? "You have a good balance of habits across different categories." 
                          : "Consider adding habits in more categories for better life balance."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Habit Dialog */}
      <Dialog open={showNewHabitDialog} onOpenChange={setShowNewHabitDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Habit" : "Add New Habit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habitTitle">Habit Title</Label>
              <Input 
                id="habitTitle" 
                placeholder="e.g., Drink water, Read for 20 minutes" 
                value={newHabit.title}
                onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="habitDescription">Description (Optional)</Label>
              <Textarea 
                id="habitDescription" 
                placeholder="Add details about your habit" 
                value={newHabit.description}
                onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="habitCategory">Category</Label>
              <Select
                value={newHabit.category}
                onValueChange={(value) => setNewHabit(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="habitCategory">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {editMode && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="habitCompleted" 
                  checked={newHabit.completed}
                  onCheckedChange={(checked) => 
                    setNewHabit(prev => ({ ...prev, completed: Boolean(checked) }))
                  }
                />
                <label htmlFor="habitCompleted" className="text-sm">
                  Mark as completed
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setShowNewHabitDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNewHabitSubmit}
              disabled={!newHabit.title}
            >
              {editMode ? "Save Changes" : "Add Habit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitTracker;
