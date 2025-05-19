import { 
  SleepEntry, 
  PeriodEntry, 
  WorkoutEntry, 
  HabitEntry, 
  BudgetEntry, 
  MoodEntry, 
  WaterEntry,
  BudgetCategory 
} from "@shared/schema";

// Helper to get data from localStorage with proper typing
function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

// Helper to store data in localStorage
function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
}

// Sleep Tracker Storage
export const sleepStorage = {
  getSleepEntries: (): SleepEntry[] => {
    return getStoredData<SleepEntry[]>('tracklife:sleep', []);
  },
  
  addSleepEntry: (entry: SleepEntry): void => {
    const entries = sleepStorage.getSleepEntries();
    setStoredData('tracklife:sleep', [...entries, entry]);
  },
  
  updateSleepEntry: (id: string, updatedEntry: Partial<SleepEntry>): void => {
    const entries = sleepStorage.getSleepEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:sleep', updatedEntries);
  },
  
  deleteSleepEntry: (id: string): void => {
    const entries = sleepStorage.getSleepEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:sleep', filteredEntries);
  },
  
  resetSleepEntries: (): void => {
    setStoredData('tracklife:sleep', []);
  }
};

// Period Tracker Storage
export const periodStorage = {
  getPeriodEntries: (): PeriodEntry[] => {
    return getStoredData<PeriodEntry[]>('tracklife:period', []);
  },
  
  addPeriodEntry: (entry: PeriodEntry): void => {
    const entries = periodStorage.getPeriodEntries();
    setStoredData('tracklife:period', [...entries, entry]);
  },
  
  updatePeriodEntry: (id: string, updatedEntry: Partial<PeriodEntry>): void => {
    const entries = periodStorage.getPeriodEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:period', updatedEntries);
  },
  
  deletePeriodEntry: (id: string): void => {
    const entries = periodStorage.getPeriodEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:period', filteredEntries);
  },
  
  resetPeriodEntries: (): void => {
    setStoredData('tracklife:period', []);
  }
};

// Workout Tracker Storage
export const workoutStorage = {
  getWorkoutEntries: (): WorkoutEntry[] => {
    return getStoredData<WorkoutEntry[]>('tracklife:workout', []);
  },
  
  addWorkoutEntry: (entry: WorkoutEntry): void => {
    const entries = workoutStorage.getWorkoutEntries();
    setStoredData('tracklife:workout', [...entries, entry]);
  },
  
  updateWorkoutEntry: (id: string, updatedEntry: Partial<WorkoutEntry>): void => {
    const entries = workoutStorage.getWorkoutEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:workout', updatedEntries);
  },
  
  deleteWorkoutEntry: (id: string): void => {
    const entries = workoutStorage.getWorkoutEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:workout', filteredEntries);
  },
  
  resetWorkoutEntries: (): void => {
    setStoredData('tracklife:workout', []);
  }
};

// Habit Tracker Storage
export const habitStorage = {
  getHabits: (): HabitEntry[] => {
    return getStoredData<HabitEntry[]>('tracklife:habits', []);
  },
  
  addHabit: (habit: HabitEntry): void => {
    const habits = habitStorage.getHabits();
    setStoredData('tracklife:habits', [...habits, habit]);
  },
  
  updateHabit: (id: string, updatedHabit: Partial<HabitEntry>): void => {
    const habits = habitStorage.getHabits();
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        return { ...habit, ...updatedHabit };
      }
      return habit;
    });
    setStoredData('tracklife:habits', updatedHabits);
  },
  
  deleteHabit: (id: string): void => {
    const habits = habitStorage.getHabits();
    const filteredHabits = habits.filter(habit => habit.id !== id);
    setStoredData('tracklife:habits', filteredHabits);
  },
  
  resetHabits: (): void => {
    setStoredData('tracklife:habits', []);
  }
};

// Budget Tracker Storage
export const budgetStorage = {
  getBudgetEntries: (): BudgetEntry[] => {
    return getStoredData<BudgetEntry[]>('tracklife:budget', []);
  },
  
  getBudgetCategories: (): BudgetCategory[] => {
    return getStoredData<BudgetCategory[]>('tracklife:budget:categories', [
      { id: '1', name: 'Food', limit: 500, color: '#10B981' },
      { id: '2', name: 'Entertainment', limit: 200, color: '#F59E0B' },
      { id: '3', name: 'Housing', limit: 1000, color: '#4F46E5' },
      { id: '4', name: 'Transport', limit: 150, color: '#EC4899' },
      { id: '5', name: 'Savings', limit: 400, color: '#06B6D4' }
    ]);
  },
  
  addBudgetEntry: (entry: BudgetEntry): void => {
    const entries = budgetStorage.getBudgetEntries();
    setStoredData('tracklife:budget', [...entries, entry]);
  },
  
  updateBudgetEntry: (id: string, updatedEntry: Partial<BudgetEntry>): void => {
    const entries = budgetStorage.getBudgetEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:budget', updatedEntries);
  },
  
  deleteBudgetEntry: (id: string): void => {
    const entries = budgetStorage.getBudgetEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:budget', filteredEntries);
  },
  
  addBudgetCategory: (category: BudgetCategory): void => {
    const categories = budgetStorage.getBudgetCategories();
    setStoredData('tracklife:budget:categories', [...categories, category]);
  },
  
  updateBudgetCategory: (id: string, updatedCategory: Partial<BudgetCategory>): void => {
    const categories = budgetStorage.getBudgetCategories();
    const updatedCategories = categories.map(category => {
      if (category.id === id) {
        return { ...category, ...updatedCategory };
      }
      return category;
    });
    setStoredData('tracklife:budget:categories', updatedCategories);
  },
  
  deleteBudgetCategory: (id: string): void => {
    const categories = budgetStorage.getBudgetCategories();
    const filteredCategories = categories.filter(category => category.id !== id);
    setStoredData('tracklife:budget:categories', filteredCategories);
  },
  
  resetBudget: (): void => {
    setStoredData('tracklife:budget', []);
    // Reset to default categories
    setStoredData('tracklife:budget:categories', [
      { id: '1', name: 'Food', limit: 500, color: '#10B981' },
      { id: '2', name: 'Entertainment', limit: 200, color: '#F59E0B' },
      { id: '3', name: 'Housing', limit: 1000, color: '#4F46E5' },
      { id: '4', name: 'Transport', limit: 150, color: '#EC4899' },
      { id: '5', name: 'Savings', limit: 400, color: '#06B6D4' }
    ]);
  }
};

// Mood Tracker Storage
export const moodStorage = {
  getMoodEntries: (): MoodEntry[] => {
    return getStoredData<MoodEntry[]>('tracklife:mood', []);
  },
  
  addMoodEntry: (entry: MoodEntry): void => {
    const entries = moodStorage.getMoodEntries();
    setStoredData('tracklife:mood', [...entries, entry]);
  },
  
  updateMoodEntry: (id: string, updatedEntry: Partial<MoodEntry>): void => {
    const entries = moodStorage.getMoodEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:mood', updatedEntries);
  },
  
  deleteMoodEntry: (id: string): void => {
    const entries = moodStorage.getMoodEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:mood', filteredEntries);
  },
  
  resetMoodEntries: (): void => {
    setStoredData('tracklife:mood', []);
  }
};

// Water Tracker Storage
export const waterStorage = {
  getWaterEntries: (): WaterEntry[] => {
    return getStoredData<WaterEntry[]>('tracklife:water', []);
  },
  
  addWaterEntry: (entry: WaterEntry): void => {
    const entries = waterStorage.getWaterEntries();
    setStoredData('tracklife:water', [...entries, entry]);
  },
  
  updateWaterEntry: (id: string, updatedEntry: Partial<WaterEntry>): void => {
    const entries = waterStorage.getWaterEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, ...updatedEntry };
      }
      return entry;
    });
    setStoredData('tracklife:water', updatedEntries);
  },
  
  deleteWaterEntry: (id: string): void => {
    const entries = waterStorage.getWaterEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    setStoredData('tracklife:water', filteredEntries);
  },
  
  resetWaterEntries: (): void => {
    setStoredData('tracklife:water', []);
  }
};

// Reset all storage for monthly reset option
export const resetAllStorage = (): void => {
  sleepStorage.resetSleepEntries();
  periodStorage.resetPeriodEntries();
  workoutStorage.resetWorkoutEntries();
  habitStorage.resetHabits();
  budgetStorage.resetBudget();
  moodStorage.resetMoodEntries();
  waterStorage.resetWaterEntries();
};
