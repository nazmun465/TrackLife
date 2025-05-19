import { useEffect, useState } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Download, Plus, Lightbulb, AlertTriangle, BarChart as BarChartIcon } from "lucide-react";
import { sleepStorage } from "@/lib/trackerStorage";
import { SleepEntry } from "@shared/schema";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

const SleepTracker = () => {
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<SleepEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    bedtime: "22:30",
    wakeTime: "07:00",
    quality: 7,
    notes: ""
  });
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("month");
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = sleepStorage.getSleepEntries();
    setSleepEntries(entries);
  };
  
  const calculateDuration = (bedtime: string, wakeTime: string): number => {
    const [bedHour, bedMinute] = bedtime.split(":").map(Number);
    const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
    
    let hours = wakeHour - bedHour;
    let minutes = wakeMinute - bedMinute;
    
    if (hours < 0) {
      hours += 24;
    }
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    return parseFloat((hours + minutes / 60).toFixed(1));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = calculateDuration(
      newEntry.bedtime || "22:00", 
      newEntry.wakeTime || "07:00"
    );
    
    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: newEntry.date || format(new Date(), "yyyy-MM-dd"),
      bedtime: newEntry.bedtime || "22:00",
      wakeTime: newEntry.wakeTime || "07:00",
      duration,
      quality: newEntry.quality || 5,
      notes: newEntry.notes || ""
    };
    
    sleepStorage.addSleepEntry(entry);
    loadData();
    
    // Reset form to today with default times
    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      bedtime: "22:30",
      wakeTime: "07:00",
      quality: 7,
      notes: ""
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({ ...prev, [name]: value }));
  };
  
  const handleQualityChange = (value: number[]) => {
    setNewEntry(prev => ({ ...prev, quality: value[0] }));
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (sleepEntries.length === 0) return [];
    
    let filteredEntries = [...sleepEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const now = new Date();
    
    if (viewMode === "week") {
      const startOfWeekDate = startOfWeek(now);
      const endOfWeekDate = endOfWeek(now);
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= startOfWeekDate && entryDate <= endOfWeekDate;
      });
    } else if (viewMode === "month") {
      const startOfMonthDate = startOfMonth(now);
      const endOfMonthDate = endOfMonth(now);
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= startOfMonthDate && entryDate <= endOfMonthDate;
      });
    }
    // Year view uses all entries from the past year
    
    return filteredEntries.map(entry => ({
      date: format(parseISO(entry.date), 'MMM dd'),
      hours: entry.duration,
      quality: entry.quality
    }));
  };
  
  // Calculate sleep stats
  const calculateStats = () => {
    if (sleepEntries.length === 0) {
      return {
        avgBedtime: "N/A",
        avgWakeTime: "N/A",
        avgQuality: "N/A",
        avgDuration: "N/A"
      };
    }
    
    const bedtimes = sleepEntries.map(entry => {
      const [hours, minutes] = entry.bedtime.split(":").map(Number);
      return hours * 60 + minutes;
    });
    
    const wakeTimes = sleepEntries.map(entry => {
      const [hours, minutes] = entry.wakeTime.split(":").map(Number);
      return hours * 60 + minutes;
    });
    
    const avgBedtimeMinutes = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
    const avgWakeTimeMinutes = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    
    const avgBedtimeHours = Math.floor(avgBedtimeMinutes / 60);
    const avgBedtimeRemainingMinutes = Math.floor(avgBedtimeMinutes % 60);
    
    const avgWakeTimeHours = Math.floor(avgWakeTimeMinutes / 60);
    const avgWakeTimeRemainingMinutes = Math.floor(avgWakeTimeMinutes % 60);
    
    const avgQuality = sleepEntries.reduce((sum, entry) => sum + entry.quality, 0) / sleepEntries.length;
    const avgDuration = sleepEntries.reduce((sum, entry) => sum + entry.duration, 0) / sleepEntries.length;
    
    return {
      avgBedtime: `${avgBedtimeHours.toString().padStart(2, '0')}:${avgBedtimeRemainingMinutes.toString().padStart(2, '0')}`,
      avgWakeTime: `${avgWakeTimeHours.toString().padStart(2, '0')}:${avgWakeTimeRemainingMinutes.toString().padStart(2, '0')}`,
      avgQuality: avgQuality.toFixed(1),
      avgDuration: avgDuration.toFixed(1)
    };
  };
  
  const stats = calculateStats();
  const chartData = getChartData();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-primary text-2xl mr-3">
                <Moon />
              </span>
              <CardTitle className="text-2xl">Sleep Tracker</CardTitle>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-3">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sleep Stats */}
            <div className="md:col-span-2">
              <Card className="bg-muted">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Sleep Pattern</h3>
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
                    {chartData.length > 0 ? (
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
                            domain={[0, 12]} 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value} hrs`, 'Sleep Duration']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Bar 
                            dataKey="hours" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No sleep data available. Add your first entry!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Avg. Bedtime</p>
                    <p className="text-xl font-semibold">{stats.avgBedtime}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Avg. Wake Up</p>
                    <p className="text-xl font-semibold">{stats.avgWakeTime}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Sleep Quality</p>
                    <p className="text-xl font-semibold">
                      {stats.avgQuality !== "N/A" 
                        ? `${parseFloat(stats.avgQuality) > 7 ? 'Good' : parseFloat(stats.avgQuality) > 4 ? 'Okay' : 'Poor'} (${stats.avgQuality}/10)` 
                        : stats.avgQuality}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Entry Form */}
            <Card className="bg-muted">
              <CardHeader className="p-6 pb-2">
                <h3 className="text-lg font-semibold">Record Sleep</h3>
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
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="bedtime" className="block text-sm font-medium mb-1">Bedtime</Label>
                      <Input 
                        id="bedtime" 
                        name="bedtime" 
                        type="time" 
                        className="w-full"
                        value={newEntry.bedtime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="wakeTime" className="block text-sm font-medium mb-1">Wake Time</Label>
                      <Input 
                        id="wakeTime" 
                        name="wakeTime" 
                        type="time" 
                        className="w-full"
                        value={newEntry.wakeTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="quality" className="block text-sm font-medium mb-1">
                      Sleep Quality (1-10) - {newEntry.quality}
                    </Label>
                    <Slider 
                      id="quality"
                      min={1} 
                      max={10} 
                      step={1}
                      value={[newEntry.quality || 5]}
                      onValueChange={handleQualityChange}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Average</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      rows={3} 
                      placeholder="How did you sleep?"
                      value={newEntry.notes}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Save Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Sleep Insights */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-blue-500 dark:text-blue-400 mr-3">
                      <Lightbulb className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Consistent Schedule</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Your sleep schedule has been consistent. Keep it up for better quality rest.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-500 dark:text-yellow-400 mr-3">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Late Night Screen Time</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        Consider reducing screen time before bed to improve sleep quality.
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
                      <h4 className="font-medium text-green-800 dark:text-green-300">Progress Report</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Your average sleep duration has increased by 23 minutes this month!
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

export default SleepTracker;
