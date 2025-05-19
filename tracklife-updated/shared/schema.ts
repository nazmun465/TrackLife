import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Sleep Tracker schemas
export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
}

// Period Tracker schemas
export interface PeriodEntry {
  id: string;
  date: string;
  type: 'period' | 'spotting' | 'symptoms';
  flow?: 'light' | 'medium' | 'heavy';
  symptoms?: string[];
  notes?: string;
}

// Workout Tracker schemas
export interface WorkoutEntry {
  id: string;
  date: string;
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  calories?: number;
  notes?: string;
}

// Habit Tracker schemas
export interface HabitEntry {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date?: string;
  streak?: number;
  category?: string;
}

// Budget Tracker schemas
export interface BudgetEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  color: string;
}

// Mood Tracker schemas
export interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  activities?: string[];
  notes?: string;
}

// Water Tracker schemas
export interface WaterEntry {
  id: string;
  date: string;
  amount: number;
  timestamp?: string;
}
