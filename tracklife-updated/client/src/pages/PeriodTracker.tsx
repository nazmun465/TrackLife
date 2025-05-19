import { useState, useEffect } from "react";
import { format, parseISO, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isToday } from "date-fns";
import { Calendar, CalendarControls, DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Download, Plus, Calendar as CalendarLucide, AlertTriangle, Info } from "lucide-react";
import { periodStorage } from "@/lib/trackerStorage";
import { PeriodEntry } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

const PeriodTracker = () => {
  // State for period entries
  const [periodEntries, setPeriodEntries] = useState<PeriodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Form state
  const [entryType, setEntryType] = useState<'period' | 'spotting' | 'symptoms'>('period');
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [symptomsSelected, setSymptomsSelected] = useState<{[key: string]: boolean}>({
    cramps: false,
    headache: false,
    bloating: false,
    fatigue: false,
    moodSwings: false,
    backPain: false,
    breastTenderness: false,
    nausea: false,
  });
  const [notes, setNotes] = useState("");
  
  // Stats and predictions
  const [cycleStats, setCycleStats] = useState({
    averageCycleLength: 28,
    averagePeriodLength: 5,
    nextPeriodDate: addDays(new Date(), 14), // Default prediction
    daysUntilNext: 14,
    cyclePhase: "follicular" // Default phase
  });
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = periodStorage.getPeriodEntries();
    setPeriodEntries(entries);
    calculateStats(entries);
  };
  
  const calculateStats = (entries: PeriodEntry[]) => {
    if (entries.length === 0) return;
    
    // Filter for only period entries (not symptoms)
    const periodStarts = entries
      .filter(entry => entry.type === 'period')
      .map(entry => new Date(entry.date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (periodStarts.length < 2) {
      // Not enough data for cycle calculation
      return;
    }
    
    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 1; i < periodStarts.length; i++) {
      const daysBetween = Math.round((periodStarts[i].getTime() - periodStarts[i-1].getTime()) / (1000 * 60 * 60 * 24));
      cycleLengths.push(daysBetween);
    }
    
    // Calculate period lengths
    const periodLengths: number[] = [];
    for (const startDate of periodStarts) {
      const endEntries = entries.filter(entry => 
        entry.type === 'period' && 
        isWithinInterval(new Date(entry.date), {
          start: startDate,
          end: addDays(startDate, 10) // Look for entries up to 10 days after start
        })
      );
      
      if (endEntries.length > 1) {
        const endDatesSorted = endEntries
          .map(entry => new Date(entry.date))
          .sort((a, b) => a.getTime() - b.getTime());
        
        const lastDayIndex = endDatesSorted.length - 1;
        const periodLength = Math.round(
          (endDatesSorted[lastDayIndex].getTime() - endDatesSorted[0].getTime()) / (1000 * 60 * 60 * 24)
        ) + 1; // +1 because we count both first and last day
        
        periodLengths.push(periodLength);
      }
    }
    
    // Calculate averages
    const avgCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length) 
      : 28;
    
    const avgPeriodLength = periodLengths.length > 0 
      ? Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length) 
      : 5;
    
    // Predict next period
    const lastPeriod = periodStarts[periodStarts.length - 1];
    const nextPeriodDate = addDays(lastPeriod, avgCycleLength);
    const today = new Date();
    const daysUntilNext = Math.round((nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine cycle phase
    let cyclePhase = "follicular";
    const daysSinceLastPeriod = Math.round((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastPeriod < avgPeriodLength) {
      cyclePhase = "menstrual";
    } else if (daysSinceLastPeriod < 14) {
      cyclePhase = "follicular";
    } else if (daysSinceLastPeriod < 17) {
      cyclePhase = "ovulation";
    } else {
      cyclePhase = "luteal";
    }
    
    setCycleStats({
      averageCycleLength: avgCycleLength,
      averagePeriodLength: avgPeriodLength,
      nextPeriodDate,
      daysUntilNext,
      cyclePhase
    });
  };
  
  const handleAddEntry = () => {
    const symptoms = Object.entries(symptomsSelected)
      .filter(([_, selected]) => selected)
      .map(([symptom]) => symptom);
    
    const entry: PeriodEntry = {
      id: Date.now().toString(),
      date: format(selectedDate, "yyyy-MM-dd"),
      type: entryType,
      flow: entryType === 'period' ? flowIntensity : undefined,
      symptoms: symptoms.length > 0 ? symptoms : undefined,
      notes: notes.trim() !== "" ? notes : undefined
    };
    
    periodStorage.addPeriodEntry(entry);
    resetForm();
    loadData();
  };
  
  const resetForm = () => {
    setEntryType('period');
    setFlowIntensity('medium');
    setSymptomsSelected({
      cramps: false,
      headache: false,
      bloating: false,
      fatigue: false,
      moodSwings: false,
      backPain: false,
      breastTenderness: false,
      nausea: false,
    });
    setNotes("");
  };
  
  // Calendar day renderer
  const dayRenderer = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    const entriesForDay = periodEntries.filter(entry => entry.date === formattedDay);
    
    let className = "relative h-9 w-9 p-0 flex items-center justify-center";
    
    if (entriesForDay.length > 0) {
      const hasPeriod = entriesForDay.some(entry => entry.type === 'period');
      const hasSpotting = entriesForDay.some(entry => entry.type === 'spotting');
      const hasSymptoms = entriesForDay.some(entry => entry.type === 'symptoms');
      
      if (hasPeriod) {
        const flowEntry = entriesForDay.find(entry => entry.type === 'period');
        if (flowEntry?.flow === 'heavy') {
          className += " bg-accent";
        } else if (flowEntry?.flow === 'medium') {
          className += " bg-accent/75";
        } else {
          className += " bg-accent/50";
        }
      } else if (hasSpotting) {
        className += " bg-accent/25";
      } else if (hasSymptoms) {
        className += " bg-yellow-200 dark:bg-yellow-900/40";
      }
    }
    
    return className;
  };
  
  // Prepare calendar data
  const getCalendarData = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.map(day => {
      const formattedDay = format(day, "yyyy-MM-dd");
      const entriesForDay = periodEntries.filter(entry => entry.date === formattedDay);
      const hasPeriod = entriesForDay.some(entry => entry.type === 'period');
      const hasSpotting = entriesForDay.some(entry => entry.type === 'spotting');
      const hasSymptoms = entriesForDay.some(entry => entry.type === 'symptoms');
      
      return {
        date: day,
        hasPeriod,
        hasSpotting,
        hasSymptoms,
        flow: hasPeriod ? entriesForDay.find(entry => entry.type === 'period')?.flow : undefined
      };
    });
  };
  
  // Prepare chart data
  const getChartData = () => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();
    
    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const periodDays = periodEntries.filter(entry => 
        entry.type === 'period' && 
        isWithinInterval(new Date(entry.date), { start: monthStart, end: monthEnd })
      ).length;
      
      const symptomDays = periodEntries.filter(entry => 
        (entry.type === 'symptoms' || (entry.type === 'period' && entry.symptoms && entry.symptoms.length > 0)) && 
        isWithinInterval(new Date(entry.date), { start: monthStart, end: monthEnd })
      ).length;
      
      return {
        month: format(month, 'MMM'),
        periodDays,
        symptomDays
      };
    });
  };
  
  // Handle symptom toggle
  const toggleSymptom = (symptom: string) => {
    setSymptomsSelected(prev => ({
      ...prev,
      [symptom]: !prev[symptom]
    }));
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-accent text-2xl mr-3">
                <CalendarLucide />
              </span>
              <CardTitle className="text-2xl">Period Tracker</CardTitle>
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
            {/* Period Calendar */}
            <div className="md:col-span-2">
              <Card className="bg-muted">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Period Calendar</h3>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                    month={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    classNames={{
                      day: dayRenderer
                    }}
                  />
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-accent mr-2"></div>
                        <span className="text-sm">Period</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-accent/25 mr-2"></div>
                        <span className="text-sm">Spotting</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-yellow-200 dark:bg-yellow-900/40 mr-2"></div>
                        <span className="text-sm">Symptoms</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Period Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Next Period</p>
                    <p className="text-xl font-semibold">{format(cycleStats.nextPeriodDate, 'MMM dd')}</p>
                    <p className="text-sm text-muted-foreground">in {cycleStats.daysUntilNext} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Avg. Cycle Length</p>
                    <p className="text-xl font-semibold">{cycleStats.averageCycleLength} days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Current Phase</p>
                    <p className="text-xl font-semibold capitalize">{cycleStats.cyclePhase}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Period History Chart */}
              <Card className="mt-4 bg-muted">
                <CardHeader className="p-6 pb-2">
                  <h3 className="text-lg font-semibold">Period History</h3>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="h-64">
                    {periodEntries.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value} days`, 
                              name === 'periodDays' ? 'Period Days' : 'Symptom Days'
                            ]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Legend />
                          <Bar 
                            name="Period Days" 
                            dataKey="periodDays" 
                            fill="hsl(var(--accent))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20}
                          />
                          <Bar 
                            name="Symptom Days" 
                            dataKey="symptomDays" 
                            fill="hsl(var(--warning, 43 96% 58%))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No period history data available. Add your first entry!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Entry Form */}
            <Card className="bg-muted">
              <CardHeader className="p-6 pb-2">
                <h3 className="text-lg font-semibold">Record Period</h3>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="mb-4">
                  <Label htmlFor="date" className="block text-sm font-medium mb-1">Date</Label>
                  <div className="relative">
                    <Input 
                      id="date" 
                      type="date" 
                      className="w-full" 
                      value={format(selectedDate, "yyyy-MM-dd")}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="entryType" className="block text-sm font-medium mb-1">Entry Type</Label>
                  <Select
                    value={entryType}
                    onValueChange={(value) => setEntryType(value as 'period' | 'spotting' | 'symptoms')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Entry Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="period">Period</SelectItem>
                      <SelectItem value="spotting">Spotting</SelectItem>
                      <SelectItem value="symptoms">Symptoms Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(entryType === 'period') && (
                  <div className="mb-4">
                    <Label htmlFor="flowIntensity" className="block text-sm font-medium mb-1">Flow Intensity</Label>
                    <Select
                      value={flowIntensity}
                      onValueChange={(value) => setFlowIntensity(value as 'light' | 'medium' | 'heavy')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Flow Intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="mb-4">
                  <Label className="block text-sm font-medium mb-2">Symptoms</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-cramps"
                        checked={symptomsSelected.cramps}
                        onCheckedChange={() => toggleSymptom('cramps')}
                      />
                      <label htmlFor="symptom-cramps" className="text-sm">Cramps</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-headache"
                        checked={symptomsSelected.headache}
                        onCheckedChange={() => toggleSymptom('headache')}
                      />
                      <label htmlFor="symptom-headache" className="text-sm">Headache</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-bloating"
                        checked={symptomsSelected.bloating}
                        onCheckedChange={() => toggleSymptom('bloating')}
                      />
                      <label htmlFor="symptom-bloating" className="text-sm">Bloating</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-fatigue"
                        checked={symptomsSelected.fatigue}
                        onCheckedChange={() => toggleSymptom('fatigue')}
                      />
                      <label htmlFor="symptom-fatigue" className="text-sm">Fatigue</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-moodSwings"
                        checked={symptomsSelected.moodSwings}
                        onCheckedChange={() => toggleSymptom('moodSwings')}
                      />
                      <label htmlFor="symptom-moodSwings" className="text-sm">Mood Swings</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-backPain"
                        checked={symptomsSelected.backPain}
                        onCheckedChange={() => toggleSymptom('backPain')}
                      />
                      <label htmlFor="symptom-backPain" className="text-sm">Back Pain</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-breastTenderness"
                        checked={symptomsSelected.breastTenderness}
                        onCheckedChange={() => toggleSymptom('breastTenderness')}
                      />
                      <label htmlFor="symptom-breastTenderness" className="text-sm">Breast Tenderness</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="symptom-nausea"
                        checked={symptomsSelected.nausea}
                        onCheckedChange={() => toggleSymptom('nausea')}
                      />
                      <label htmlFor="symptom-nausea" className="text-sm">Nausea</label>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</Label>
                  <Textarea 
                    id="notes" 
                    rows={3} 
                    placeholder="Any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Button onClick={handleAddEntry} className="w-full">
                  Save Entry
                </Button>
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
                      <Info className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Cycle Information</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        You're currently in your {cycleStats.cyclePhase} phase. {
                          cycleStats.cyclePhase === 'menstrual' ? 'Take care and rest if needed.' :
                          cycleStats.cyclePhase === 'follicular' ? 'Energy levels are rising.' :
                          cycleStats.cyclePhase === 'ovulation' ? 'You may have more energy and higher libido.' :
                          'PMS symptoms may appear. Be gentle with yourself.'
                        }
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
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Period Due Soon</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        {cycleStats.daysUntilNext <= 5 
                          ? `Your period is expected to start in ${cycleStats.daysUntilNext} days. Be prepared!` 
                          : `Your next period is expected on ${format(cycleStats.nextPeriodDate, 'MMMM d')}.`}
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
                      <h4 className="font-medium text-green-800 dark:text-green-300">Tracking Benefits</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Regular tracking helps identify patterns and predict cycle changes, helping you prepare better.
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

export default PeriodTracker;
