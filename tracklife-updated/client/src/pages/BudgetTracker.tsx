import { useState, useEffect } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Download, Plus, BarChart, PieChart, TrendingUp, AlertTriangle, Trash2, Edit } from "lucide-react";
import { budgetStorage } from "@/lib/trackerStorage";
import { BudgetEntry, BudgetCategory } from "@shared/schema";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = [
  "#4F46E5", // primary
  "#EC4899", // accent
  "#F59E0B", // warning
  "#10B981", // success
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#14B8A6", // teal
  "#0EA5E9", // sky
  "#F43F5E", // rose
];

const BudgetTracker = () => {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [viewMode, setViewMode] = useState<"expenses" | "income" | "all">("expenses");
  const [timeFrame, setTimeFrame] = useState<"month" | "3months" | "6months" | "year">("month");
  
  // Form state
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<BudgetEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    description: "",
    categoryId: "",
    type: "expense"
  });
  
  const [newCategory, setNewCategory] = useState<Partial<BudgetCategory>>({
    name: "",
    limit: 0,
    color: "#4F46E5"
  });
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCategoryMode, setEditCategoryMode] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    expenseTrend: 0,
    categorySpending: [] as Array<{
      categoryId: string;
      name: string;
      spent: number;
      limit: number;
      percentage: number;
      color: string;
    }>
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    const entries = budgetStorage.getBudgetEntries();
    const cats = budgetStorage.getBudgetCategories();
    setBudgetEntries(entries);
    setCategories(cats);
    calculateStats(entries, cats);
  };
  
  const calculateStats = (entries: BudgetEntry[], cats: BudgetCategory[]) => {
    // Filter for current month
    const today = new Date();
    const startOfThisMonth = startOfMonth(today);
    
    const currentMonthEntries = entries.filter(entry => 
      isWithinInterval(new Date(entry.date), {
        start: startOfThisMonth,
        end: today
      })
    );
    
    // Calculate totals
    const totalExpenses = currentMonthEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalIncome = currentMonthEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Category spending
    const categorySpending = cats.map(category => {
      const categoryEntries = currentMonthEntries.filter(entry => 
        entry.type === 'expense' && entry.categoryId === category.id
      );
      const spent = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const percentage = category.limit > 0 ? Math.min(100, Math.round((spent / category.limit) * 100)) : 0;
      
      return {
        categoryId: category.id,
        name: category.name,
        spent,
        limit: category.limit,
        percentage,
        color: category.color
      };
    }).sort((a, b) => b.spent - a.spent);
    
    // Calculate expense trend (compare with previous month)
    const prevMonthStart = startOfMonth(subMonths(today, 1));
    const prevMonthEnd = endOfMonth(subMonths(today, 1));
    
    const prevMonthEntries = entries.filter(entry => 
      entry.type === 'expense' && 
      isWithinInterval(new Date(entry.date), {
        start: prevMonthStart,
        end: prevMonthEnd
      })
    );
    
    const prevMonthTotal = prevMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const expenseTrend = prevMonthTotal > 0 
      ? ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100 
      : 0;
    
    setStats({
      totalExpenses,
      totalIncome,
      balance,
      expenseTrend,
      categorySpending
    });
  };
  
  const handleSubmitEntry = () => {
    if (!newEntry.amount || !newEntry.categoryId || !newEntry.description) return;
    
    const entry: BudgetEntry = {
      id: editId || Date.now().toString(),
      date: newEntry.date || format(new Date(), "yyyy-MM-dd"),
      amount: newEntry.amount,
      description: newEntry.description,
      categoryId: newEntry.categoryId,
      type: newEntry.type as 'income' | 'expense'
    };
    
    if (editMode && editId) {
      budgetStorage.updateBudgetEntry(editId, entry);
      setEditMode(false);
      setEditId(null);
    } else {
      budgetStorage.addBudgetEntry(entry);
    }
    
    resetEntryForm();
    setShowEntryDialog(false);
    loadData();
  };
  
  const handleSubmitCategory = () => {
    if (!newCategory.name || newCategory.limit === undefined) return;
    
    const category: BudgetCategory = {
      id: editId || Date.now().toString(),
      name: newCategory.name,
      limit: newCategory.limit,
      color: newCategory.color || "#4F46E5"
    };
    
    if (editCategoryMode && editId) {
      budgetStorage.updateBudgetCategory(editId, category);
      setEditCategoryMode(false);
      setEditId(null);
    } else {
      budgetStorage.addBudgetCategory(category);
    }
    
    resetCategoryForm();
    setShowCategoryDialog(false);
    loadData();
  };
  
  const handleEditEntry = (entry: BudgetEntry) => {
    setNewEntry(entry);
    setEditMode(true);
    setEditId(entry.id);
    setShowEntryDialog(true);
  };
  
  const handleDeleteEntry = (id: string) => {
    budgetStorage.deleteBudgetEntry(id);
    loadData();
  };
  
  const handleEditCategory = (category: BudgetCategory) => {
    setNewCategory(category);
    setEditCategoryMode(true);
    setEditId(category.id);
    setShowCategoryDialog(true);
  };
  
  const handleDeleteCategory = (id: string) => {
    budgetStorage.deleteBudgetCategory(id);
    loadData();
  };
  
  const resetEntryForm = () => {
    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      description: "",
      categoryId: "",
      type: "expense"
    });
    setEditMode(false);
    setEditId(null);
  };
  
  const resetCategoryForm = () => {
    setNewCategory({
      name: "",
      limit: 0,
      color: "#4F46E5"
    });
    setEditCategoryMode(false);
    setEditId(null);
  };
  
  // Prepare chart data based on time frame and view mode
  const getChartData = () => {
    if (budgetEntries.length === 0) return [];
    
    const today = new Date();
    let startDate: Date;
    
    switch (timeFrame) {
      case "month":
        startDate = startOfMonth(today);
        break;
      case "3months":
        startDate = startOfMonth(subMonths(today, 2));
        break;
      case "6months":
        startDate = startOfMonth(subMonths(today, 5));
        break;
      case "year":
        startDate = startOfMonth(subMonths(today, 11));
        break;
      default:
        startDate = startOfMonth(today);
    }
    
    // Group entries by month
    const months: { [key: string]: { expenses: number, income: number } } = {};
    
    // Initialize all months in the range
    let currentDate = startDate;
    while (currentDate <= today) {
      const monthKey = format(currentDate, "MMM yyyy");
      months[monthKey] = { expenses: 0, income: 0 };
      currentDate = startOfMonth(subMonths(currentDate, -1));
    }
    
    // Fill with actual data
    budgetEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= startDate && entryDate <= today) {
        const monthKey = format(entryDate, "MMM yyyy");
        if (months[monthKey]) {
          if (entry.type === 'expense') {
            months[monthKey].expenses += entry.amount;
          } else {
            months[monthKey].income += entry.amount;
          }
        }
      }
    });
    
    // Convert to array for chart
    return Object.entries(months).map(([month, data]) => ({
      month,
      expenses: data.expenses,
      income: data.income,
      balance: data.income - data.expenses
    })).sort((a, b) => {
      // Sort chronologically
      const monthA = new Date(a.month);
      const monthB = new Date(b.month);
      return monthA.getTime() - monthB.getTime();
    });
  };
  
  // Prepare category spending data
  const getCategoryData = () => {
    return stats.categorySpending.map(category => ({
      name: category.name,
      value: category.spent,
      color: category.color
    }));
  };
  
  // Get recent entries based on view mode
  const getRecentEntries = () => {
    return [...budgetEntries]
      .filter(entry => {
        if (viewMode === "expenses") return entry.type === "expense";
        if (viewMode === "income") return entry.type === "income";
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };
  
  const chartData = getChartData();
  const categoryData = getCategoryData();
  const recentEntries = getRecentEntries();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="mb-16">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center">
              <span className="text-warning text-2xl mr-3">
                <DollarSign />
              </span>
              <CardTitle className="text-2xl">Budget Tracker</CardTitle>
            </div>
            <div className="flex mt-4 md:mt-0 space-x-3">
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                className="flex items-center"
                onClick={() => {
                  resetEntryForm();
                  setShowEntryDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Overview */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className={`border-l-4 ${stats.balance >= 0 ? 'border-l-success' : 'border-l-destructive'}`}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${Math.abs(stats.balance).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.balance >= 0 ? 'Surplus' : 'Deficit'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-destructive">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.expenseTrend > 0 
                        ? <span className="text-destructive">+{stats.expenseTrend.toFixed(1)}% from last month</span> 
                        : <span className="text-success">{stats.expenseTrend.toFixed(1)}% from last month</span>}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-success">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-2xl font-bold">${stats.totalIncome.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chart */}
              <Card className="bg-muted mb-6">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Financial Overview</h3>
                    <div className="flex space-x-2">
                      <Tabs defaultValue="month" value={timeFrame}>
                        <TabsList>
                          <TabsTrigger 
                            value="month" 
                            onClick={() => setTimeFrame("month")}
                          >
                            Month
                          </TabsTrigger>
                          <TabsTrigger 
                            value="3months" 
                            onClick={() => setTimeFrame("3months")}
                          >
                            3 Months
                          </TabsTrigger>
                          <TabsTrigger 
                            value="6months" 
                            onClick={() => setTimeFrame("6months")}
                          >
                            6 Months
                          </TabsTrigger>
                          <TabsTrigger 
                            value="year" 
                            onClick={() => setTimeFrame("year")}
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
                        <RechartsBarChart data={chartData}>
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
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Legend />
                          <Bar 
                            name="Income" 
                            dataKey="income" 
                            fill="hsl(var(--success))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={24}
                          />
                          <Bar 
                            name="Expenses" 
                            dataKey="expenses" 
                            fill="hsl(var(--destructive))" 
                            radius={[4, 4, 0, 0]} 
                            barSize={24}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No budget data available. Add your first transaction!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Category Spending */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold">Category Spending</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          resetCategoryForm();
                          setShowCategoryDialog(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {stats.categorySpending.length > 0 ? (
                      <div className="space-y-3">
                        {stats.categorySpending.slice(0, 5).map((category) => (
                          <div key={category.categoryId}>
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                              </div>
                              <span>${category.spent.toFixed(2)} / ${category.limit}</span>
                            </div>
                            <Progress 
                              value={category.percentage} 
                              className={`h-2 mt-1 ${category.percentage > 90 ? 'bg-destructive/20' : ''}`}
                            />
                          </div>
                        ))}
                        
                        {stats.categorySpending.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            +{stats.categorySpending.length - 5} more categories
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <div className="text-center">
                          <PieChart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p>No category data</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-muted">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold">Recent Transactions</h3>
                      <Tabs defaultValue="all" value={viewMode}>
                        <TabsList className="h-8">
                          <TabsTrigger 
                            value="expenses" 
                            onClick={() => setViewMode("expenses")}
                            className="text-xs"
                          >
                            Expenses
                          </TabsTrigger>
                          <TabsTrigger 
                            value="income" 
                            onClick={() => setViewMode("income")}
                            className="text-xs"
                          >
                            Income
                          </TabsTrigger>
                          <TabsTrigger 
                            value="all" 
                            onClick={() => setViewMode("all")}
                            className="text-xs"
                          >
                            All
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="max-h-48 overflow-y-auto">
                      {recentEntries.length > 0 ? (
                        <div className="space-y-2">
                          {recentEntries.map(entry => {
                            const category = categories.find(c => c.id === entry.categoryId);
                            return (
                              <div key={entry.id} className="flex justify-between items-center p-2 border-b last:border-0 group">
                                <div className="flex items-center">
                                  <div 
                                    className="w-2 h-8 rounded-sm mr-3" 
                                    style={{ backgroundColor: category?.color || "#4F46E5" }}
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{entry.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(entry.date), "MMM dd, yyyy")} · {category?.name || "Uncategorized"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${entry.type === 'expense' ? 'text-destructive' : 'text-success'}`}>
                                    {entry.type === 'expense' ? '-' : '+'}${entry.amount.toFixed(2)}
                                  </span>
                                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6"
                                      onClick={() => handleEditEntry(entry)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => handleDeleteEntry(entry.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-36 text-muted-foreground">
                          <div className="text-center">
                            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>No transactions yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Budget Categories & Tips */}
            <div>
              <Card className="mb-6">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Budget Categories</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        resetCategoryForm();
                        setShowCategoryDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {categories.length > 0 ? (
                    <div className="space-y-3">
                      {categories.map(category => (
                        <div key={category.id} className="flex justify-between items-center group hover:bg-muted/50 p-2 rounded-md transition-colors">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm mr-2">${category.limit}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <h3 className="text-lg font-medium mb-1">No categories</h3>
                      <p className="text-sm mb-4">Create categories to organize your expenses</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          resetCategoryForm();
                          setShowCategoryDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Category
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Budget Tips */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <h3 className="text-lg font-semibold">Budgeting Tips</h3>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <PieChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">50/30/20 Rule</h4>
                        <p className="text-xs text-muted-foreground mt-1">Allocate 50% of your income to needs, 30% to wants, and 20% to savings.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <BarChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Track Every Expense</h4>
                        <p className="text-xs text-muted-foreground mt-1">Keep track of all expenses, even small ones. They add up quickly!</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 text-primary p-2 rounded-full">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Pay Yourself First</h4>
                        <p className="text-xs text-muted-foreground mt-1">Set aside savings at the beginning of the month before spending on other things.</p>
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
                      <BarChart className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Spending Analysis</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        {stats.totalExpenses > 0
                          ? `Your top spending category is ${stats.categorySpending[0]?.name || 'Uncategorized'} at $${stats.categorySpending[0]?.spent.toFixed(2) || 0}.`
                          : "Start tracking your expenses to get personalized insights."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`${stats.balance >= 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className={`${stats.balance >= 0 
                      ? 'text-green-500 dark:text-green-400' 
                      : 'text-yellow-500 dark:text-yellow-400'} mr-3`}
                    >
                      {stats.balance >= 0 
                        ? <TrendingUp className="h-5 w-5" /> 
                        : <AlertTriangle className="h-5 w-5" />}
                    </span>
                    <div>
                      <h4 className={`font-medium ${stats.balance >= 0 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-yellow-800 dark:text-yellow-300'}`}
                      >
                        {stats.balance >= 0 ? 'Positive Balance' : 'Budget Alert'}
                      </h4>
                      <p className={`text-sm ${stats.balance >= 0 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-yellow-700 dark:text-yellow-400'} mt-1`}
                      >
                        {stats.balance >= 0
                          ? `Great job! You're ${stats.balance > stats.totalIncome * 0.1 
                              ? 'significantly under budget' 
                              : 'within budget'} this month.`
                          : `You're over budget by $${Math.abs(stats.balance).toFixed(2)} this month. Consider reducing expenses.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <span className="text-purple-500 dark:text-purple-400 mr-3">
                      <PieChart className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-300">Budget Optimization</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                        {stats.categorySpending.some(cat => cat.percentage > 90)
                          ? `You're close to your limit in ${stats.categorySpending.filter(cat => cat.percentage > 90).length} categories. Consider adjusting your budget.`
                          : "Your category budgets look balanced. Keep maintaining this spending pattern."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newEntry.type === "expense" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setNewEntry(prev => ({ ...prev, type: "expense" }))}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={newEntry.type === "income" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setNewEntry(prev => ({ ...prev, type: "income" }))}
                >
                  Income
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0.00" 
                value={newEntry.amount || ""}
                onChange={(e) => setNewEntry(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="e.g., Groceries, Salary" 
                value={newEntry.description || ""}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newEntry.categoryId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No categories available. <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs" 
                    onClick={() => {
                      setShowEntryDialog(false);
                      resetCategoryForm();
                      setShowCategoryDialog(true);
                    }}
                  >
                    Create one first
                  </Button>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetEntryForm();
                setShowEntryDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEntry}
              disabled={!newEntry.amount || !newEntry.categoryId || !newEntry.description}
            >
              {editMode ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editCategoryMode ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input 
                id="categoryName" 
                placeholder="e.g., Food, Rent, Transportation" 
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryLimit">Monthly Limit ($)</Label>
              <Input 
                id="categoryLimit" 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0.00" 
                value={newCategory.limit || ""}
                onChange={(e) => setNewCategory(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryColor">Color</Label>
              <div className="grid grid-cols-9 gap-2">
                {COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`w-8 h-8 rounded-full ${newCategory.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetCategoryForm();
                setShowCategoryDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitCategory}
              disabled={!newCategory.name || newCategory.limit === undefined}
            >
              {editCategoryMode ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetTracker;
