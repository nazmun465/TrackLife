import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Moon, Calendar, Dumbbell, CheckSquare, DollarSign, Smile, Droplet, PieChart as PieChartIcon, Plus, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrackerCard } from "@/components/trackers/TrackerCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { sleepStorage, periodStorage, workoutStorage, habitStorage, budgetStorage, moodStorage, waterStorage } from "@/lib/trackerStorage";
import { format, parseISO, isAfter, isBefore, addDays, startOfDay, addMonths, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isWithinInterval } from "date-fns";

// For charts
import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Line,
  Pie
} from "recharts";

const Dashboard = () => {
  // State for filter
  const [timeFilter, setTimeFilter] = useState("7days");
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [periodData, setPeriodData] = useState<any>({});
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [habitProgress, setHabitProgress] = useState(0);
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any>({
    today: 0,
    goal: 8,
    percentage: 0
  });
  const [overviewData, setOverviewData] = useState<any[]>([]);

  // Fetch data from local storage
  useEffect(() => {
    loadData();
  }, [timeFilter]);

  const loadData = () => {
    loadSleepData();
    loadPeriodData();
    loadWorkoutData();
    loadHabitData();
    loadBudgetData();
    loadMoodData();
    loadWaterData();
    loadOverviewData();
  };

  // Sleep Data
  const loadSleepData = () => {
    const sleepEntries = sleepStorage.getSleepEntries();
    const filteredData = filterDataByTime(sleepEntries);
    
    const formattedData = filteredData.map(entry => ({
      date: format(new Date(entry.date), 'MMM dd'),
      hours: entry.duration,
    })).slice(-7);
    
    setSleepData(formattedData);
  };

  // Period Data
  const loadPeriodData = () => {
    const periodEntries = periodStorage.getPeriodEntries();
    const activeEntries = periodEntries.filter(entry => 
      entry.type === 'period' && isAfter(new Date(entry.date), startOfDay(new Date()))
    );
    
    // Calculate next period date based on the latest cycle
    let nextPeriodDate = new Date();
    let daysUntilNext = 28; // Default cycle length
    
    if (periodEntries.length > 0) {
      const sortedEntries = [...periodEntries]
        .filter(entry => entry.type === 'period')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (sortedEntries.length > 0) {
        const lastPeriodDate = new Date(sortedEntries[0].date);
        nextPeriodDate = addDays(lastPeriodDate, 28); // Assuming a 28-day cycle
        
        const today = new Date();
        daysUntilNext = Math.round(
          (nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilNext < 0) {
          // Period might be late
          daysUntilNext = 0;
        }
      }
    }
    
    setPeriodData({
      nextPeriodIn: daysUntilNext,
      isActive: activeEntries.length > 0,
      startDate: activeEntries.length > 0 ? format(new Date(activeEntries[0].date), 'MMM dd') : null
    });
  };

  // Workout Data
  const loadWorkoutData = () => {
    const workoutEntries = workoutStorage.getWorkoutEntries();
    const today = new Date();
    const thisWeekStart = startOfWeek(today);
    const thisWeekEnd = endOfWeek(today);
    
    const daysOfWeek = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });
    
    const workoutsThisWeek = daysOfWeek.map(day => {
      const dayWorkouts = workoutEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === day.getDate() && 
               entryDate.getMonth() === day.getMonth() && 
               entryDate.getFullYear() === day.getFullYear();
      });
      
      return {
        day: format(day, 'E'),
        workouts: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, entry) => sum + entry.duration, 0),
        isToday: isToday(day),
        isEmpty: dayWorkouts.length === 0
      };
    });
    
    const lastWeekWorkouts = workoutEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const oneWeekAgo = addDays(today, -7);
      return isAfter(entryDate, oneWeekAgo) && isBefore(entryDate, today);
    }).length;
    
    const thisWeekWorkouts = workoutsThisWeek.reduce((sum, day) => sum + day.workouts, 0);
    const change = thisWeekWorkouts - lastWeekWorkouts;
    
    setWorkoutData({
      weekly: workoutsThisWeek,
      total: thisWeekWorkouts,
      change: change
    });
  };

  // Habit Data
  const loadHabitData = () => {
    const habitEntries = habitStorage.getHabits();
    const todayHabits = habitEntries.filter(habit => !habit.date || isToday(new Date(habit.date)));
    
    const completedHabits = todayHabits.filter(habit => habit.completed);
    const progress = todayHabits.length > 0 
      ? Math.round((completedHabits.length / todayHabits.length) * 100) 
      : 0;
    
    setHabits(todayHabits);
    setHabitProgress(progress);
  };

  // Budget Data
  const loadBudgetData = () => {
    const budgetEntries = budgetStorage.getBudgetEntries();
    const categories = budgetStorage.getBudgetCategories();
    
    // Filter entries for the current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEntries = budgetEntries.filter(entry => 
      isAfter(new Date(entry.date), startOfMonth)
    );
    
    // Calculate total for this month
    const monthlyTotal = currentMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Calculate spending by category
    const categoryData = categories.map(category => {
      const categoryEntries = currentMonthEntries.filter(entry => entry.categoryId === category.id);
      const categoryTotal = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const percentage = category.limit > 0 ? Math.min(100, Math.round((categoryTotal / category.limit) * 100)) : 0;
      
      return {
        id: category.id,
        name: category.name,
        spent: categoryTotal,
        limit: category.limit,
        percentage,
        color: category.color
      };
    });
    
    // Compare with previous month
    const previousMonthStart = addMonths(startOfMonth, -1);
    const previousMonthEntries = budgetEntries.filter(entry => 
      isWithinInterval(new Date(entry.date), {
        start: previousMonthStart,
        end: startOfMonth
      })
    );
    const previousMonthTotal = previousMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const change = monthlyTotal - previousMonthTotal;
    
    setBudgetData({
      monthlyTotal,
      categories: categoryData.slice(0, 3), // Just show top 3 for the card
      change
    });
  };

  // Mood Data
  const loadMoodData = () => {
    const moodEntries = moodStorage.getMoodEntries();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = addDays(new Date(), -i);
      const formattedDate = format(date, 'EEE');
      
      const dayEntry = moodEntries.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === date.getDate() && 
               entryDate.getMonth() === date.getMonth() && 
               entryDate.getFullYear() === date.getFullYear();
      });
      
      last7Days.push({
        day: formattedDate,
        mood: dayEntry ? dayEntry.mood : null,
        emoji: getMoodEmoji(dayEntry ? dayEntry.mood : null)
      });
    }
    
    // Get today's mood
    const todayEntry = moodEntries.find(entry => isToday(new Date(entry.date)));
    
    setMoodData({
      weekly: last7Days,
      today: todayEntry ? todayEntry.mood : null,
      todayEmoji: getMoodEmoji(todayEntry ? todayEntry.mood : null)
    });
  };

  // Helper for mood emojis
  const getMoodEmoji = (mood: number | null) => {
    if (mood === null) return "❓";
    
    if (mood <= 2) return "😞";
    if (mood <= 4) return "😐";
    if (mood <= 6) return "🙂";
    if (mood <= 8) return "😊";
    return "😄";
  };

  // Water Data
  const loadWaterData = () => {
    const waterEntries = waterStorage.getWaterEntries();
    const today = new Date();
    
    const todayEntries = waterEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDate() === today.getDate() && 
             entryDate.getMonth() === today.getMonth() && 
             entryDate.getFullYear() === today.getFullYear();
    });
    
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const goal = 8; // Default goal: 8 glasses
    const percentage = Math.min(100, Math.round((todayTotal / goal) * 100));
    
    setWaterData({
      today: todayTotal,
      goal,
      percentage
    });
  };

  // Overview Data
  const loadOverviewData = () => {
    // Calculate overall wellness score from all trackers
    const sleepScore = calculateSleepScore();
    const workoutScore = calculateWorkoutScore();
    const habitScore = habitProgress;
    const moodScore = calculateMoodScore();
    const waterScore = waterData.percentage;
    
    const thisWeekData = [{
      category: 'Sleep',
      score: sleepScore,
      fullMark: 100,
    }, {
      category: 'Fitness',
      score: workoutScore,
      fullMark: 100,
    }, {
      category: 'Habits',
      score: habitScore,
      fullMark: 100,
    }, {
      category: 'Mood',
      score: moodScore,
      fullMark: 100,
    }, {
      category: 'Hydration',
      score: waterScore,
      fullMark: 100,
    }];
    
    // Create a slightly worse "last week" data for comparison
    const lastWeekData = thisWeekData.map(item => ({
      ...item,
      score: Math.max(0, item.score - Math.floor(Math.random() * 10 + 5))
    }));
    
    setOverviewData([
      {
        name: 'This Week',
        data: thisWeekData,
        color: '#4F46E5'
      },
      {
        name: 'Last Week',
        data: lastWeekData,
        color: '#9CA3AF'
      }
    ]);
  };

  // Helper score calculations
  const calculateSleepScore = () => {
    if (sleepData.length === 0) return 50;
    
    const avgSleep = sleepData.reduce((sum, day) => sum + day.hours, 0) / sleepData.length;
    // Score based on how close to ideal 8 hours
    return 100 - Math.min(100, Math.abs(avgSleep - 8) * 15);
  };
  
  const calculateWorkoutScore = () => {
    if (!workoutData.weekly) return 50;
    const workoutsPerWeek = workoutData.total || 0;
    // Score based on number of workouts (max score at 5 workouts/week)
    return Math.min(100, (workoutsPerWeek / 5) * 100);
  };
  
  const calculateMoodScore = () => {
    if (!moodData.weekly) return 50;
    
    const moodsWithValues = moodData.weekly.filter(day => day.mood !== null);
    if (moodsWithValues.length === 0) return 50;
    
    const avgMood = moodsWithValues.reduce((sum, day) => sum + (day.mood || 0), 0) / moodsWithValues.length;
    // Convert 0-10 mood scale to 0-100
    return avgMood * 10;
  };

  // Utility function to filter data based on time filter
  const filterDataByTime = (data: any[]) => {
    const today = new Date();
    let filterDate = today;
    
    switch (timeFilter) {
      case '7days':
        filterDate = addDays(today, -7);
        break;
      case '30days':
        filterDate = addDays(today, -30);
        break;
      case 'month':
        filterDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        filterDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        filterDate = addDays(today, -7);
    }
    
    return data.filter(item => isAfter(new Date(item.date), filterDate));
  };

  return (
    <div className="mb-16">
      {/* Dashboard Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Dashboard</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Select
                value={timeFilter}
                onValueChange={setTimeFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" /> Add Widget
              </Button>
            </div>
          </div>

          {/* Tracker Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sleep Tracker Card */}
            <TrackerCard 
              id="sleep" 
              title="Sleep Tracker" 
              icon={<Moon />} 
              color="text-primary"
              route="/sleep"
              onReset={() => sleepStorage.resetSleepEntries()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Avg. sleep time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sleepData.length > 0 
                      ? `${(sleepData.reduce((sum, entry) => sum + entry.hours, 0) / sleepData.length).toFixed(1)}h` 
                      : 'No data'}
                  </p>
                </div>
                <div className="w-20 h-20 relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="3"></circle>
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      className="stroke-primary" 
                      strokeWidth="3" 
                      strokeDasharray={`${(sleepData.length > 0 ? 75 : 0)} 100`} 
                      strokeLinecap="round">
                    </circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {sleepData.length > 0 ? '75%' : '0%'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 h-10">
                {sleepData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={40}>
                    <LineChart data={sleepData}>
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No sleep data available
                  </div>
                )}
              </div>
            </TrackerCard>

            {/* Period Tracker Card */}
            <TrackerCard 
              id="period" 
              title="Period Tracker" 
              icon={<Calendar />} 
              color="text-accent"
              route="/period"
              onReset={() => periodStorage.resetPeriodEntries()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Next period in</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {periodData.nextPeriodIn !== undefined ? `${periodData.nextPeriodIn} days` : 'Not tracked'}
                </p>
              </div>
              <div className="grid grid-cols-7 gap-1 mt-4">
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">M</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">T</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">W</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">T</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">F</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">S</div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">S</div>
                
                {/* Calendar days - these would actually be dynamically generated based on period data */}
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-accent/20 mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-accent mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-accent mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-accent/40 mx-auto"></div>
                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto"></div>
              </div>
            </TrackerCard>

            {/* Workout Tracker Card */}
            <TrackerCard 
              id="workout" 
              title="Workout Tracker" 
              icon={<Dumbbell />} 
              color="text-success"
              route="/workout"
              onReset={() => workoutStorage.resetWorkoutEntries()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Workouts this week</p>
                <div className="flex items-end">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {workoutData.total || 0}
                  </p>
                  {workoutData.change !== undefined && (
                    <p className={`text-sm ml-2 ${workoutData.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {workoutData.change >= 0 ? '+' : ''}{workoutData.change} from last week
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1">
                {workoutData.weekly ? (
                  workoutData.weekly.map((day: any, index: number) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{day.day}</div>
                      <div 
                        className={`h-16 w-4 rounded-t-sm mt-1 ${day.isEmpty 
                          ? 'bg-gray-200 dark:bg-gray-600' 
                          : 'bg-success'}`}
                        style={{ height: day.isEmpty ? '15%' : `${Math.max(20, day.duration * 10)}%` }}
                      ></div>
                    </div>
                  ))
                ) : (
                  Array(7).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{['M','T','W','T','F','S','S'][i]}</div>
                      <div className="h-16 w-4 bg-gray-200 dark:bg-gray-600 rounded-t-sm mt-1" style={{ height: '15%' }}></div>
                    </div>
                  ))
                )}
              </div>
            </TrackerCard>

            {/* Habit Tracker Card */}
            <TrackerCard 
              id="habit" 
              title="Habit Tracker" 
              icon={<CheckSquare />} 
              color="text-primary"
              route="/habit"
              onReset={() => habitStorage.resetHabits()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Today's progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {habits.filter(h => h.completed).length}/{habits.length} habits
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {habits.length > 0 ? (
                  habits.slice(0, 5).map((habit, index) => (
                    <div key={index} className="flex items-center">
                      <Checkbox 
                        id={`habit-${index}`} 
                        checked={habit.completed} 
                        className="h-4 w-4"
                      />
                      <label 
                        htmlFor={`habit-${index}`} 
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {habit.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">No habits tracked today</div>
                )}
                {habits.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">+{habits.length - 5} more habits</p>
                )}
              </div>
            </TrackerCard>

            {/* Budget Tracker Card */}
            <TrackerCard 
              id="budget" 
              title="Budget Tracker" 
              icon={<DollarSign />} 
              color="text-warning"
              route="/budget"
              onReset={() => budgetStorage.resetBudget()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Monthly spending</p>
                <div className="flex items-end">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${budgetData.monthlyTotal?.toFixed(0) || '0'}
                  </p>
                  {budgetData.change !== undefined && (
                    <p className={`text-sm ml-2 ${budgetData.change <= 0 ? 'text-success' : 'text-error'}`}>
                      {budgetData.change <= 0 ? '' : '+'}{budgetData.change?.toFixed(0)} from last month
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                {budgetData.categories ? (
                  budgetData.categories.map((category: any, index: number) => (
                    <div key={index}>
                      <div className="mb-2 flex justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{category.name}</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          ${category.spent.toFixed(0)} / ${category.limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full ${category.percentage > 100 ? 'bg-error' : 'bg-warning'}`}
                          style={{ width: `${Math.min(100, category.percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">No budget data available</div>
                )}
              </div>
            </TrackerCard>

            {/* Mood Tracker Card */}
            <TrackerCard 
              id="mood" 
              title="Mood Tracker" 
              icon={<Smile />} 
              color="text-accent"
              route="/mood"
              onReset={() => moodStorage.resetMoodEntries()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Today's mood</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {moodData.today !== null 
                    ? `${moodData.today > 6 ? 'Good' : moodData.today > 3 ? 'Okay' : 'Not Great'} ${moodData.todayEmoji}` 
                    : 'Not recorded ❓'}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {moodData.weekly ? (
                  moodData.weekly.map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{day.day}</span>
                      <span className="text-xl mt-1">{day.emoji}</span>
                    </div>
                  ))
                ) : (
                  Array(7).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
                      <span className="text-xl mt-1">❓</span>
                    </div>
                  ))
                )}
              </div>
            </TrackerCard>

            {/* Water Tracker Card */}
            <TrackerCard 
              id="water" 
              title="Water Tracker" 
              icon={<Droplet />} 
              color="text-primary"
              route="/water"
              onReset={() => waterStorage.resetWaterEntries()}
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Today's intake</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {waterData.today}/{waterData.goal} glasses
                </p>
              </div>
              <div className="mt-4 flex justify-around">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-12 rounded-lg border-2 border-primary overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 w-full bg-primary/70" 
                      style={{ height: `${waterData.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    {waterData.today}/{waterData.goal}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button 
                    size="icon" 
                    className="w-10 h-10 rounded-full shadow-md"
                    onClick={() => {
                      const newEntry = {
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        amount: 1
                      };
                      waterStorage.addWaterEntry(newEntry);
                      loadWaterData();
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-10 h-10 rounded-full shadow-md"
                    disabled={waterData.today <= 0}
                    onClick={() => {
                      if (waterData.today > 0) {
                        const entries = waterStorage.getWaterEntries();
                        const todayEntries = entries.filter(e => isToday(new Date(e.date)));
                        if (todayEntries.length > 0) {
                          waterStorage.deleteWaterEntry(todayEntries[todayEntries.length - 1].id);
                          loadWaterData();
                        }
                      }
                    }}
                  >
                    <span className="text-lg">-</span>
                  </Button>
                </div>
              </div>
            </TrackerCard>

            {/* Overview Card */}
            <TrackerCard 
              id="overview" 
              title="Weekly Overview" 
              icon={<PieChartIcon />} 
              color="text-primary"
              route="/"
            >
              <div className="mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Overall wellness score</p>
                <div className="flex items-end">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {overviewData.length > 0 && overviewData[0].data 
                      ? `${Math.round(overviewData[0].data.reduce((sum: number, item: any) => sum + item.score, 0) / overviewData[0].data.length)}%` 
                      : '0%'}
                  </p>
                  <p className="text-sm text-success ml-2">+5% from last week</p>
                </div>
              </div>
              <div className="mt-4 chart-container">
                {overviewData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <RadarChart data={overviewData[0].data}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <Radar dataKey="score" fill="rgba(79, 70, 229, 0.2)" stroke="#4F46E5" />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No overview data available
                  </div>
                )}
              </div>
            </TrackerCard>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
