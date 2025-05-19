import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for trackers
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API endpoints for Sleep Tracker
  app.get('/api/sleep', (req, res) => {
    res.json({ message: 'Sleep tracker data is stored locally in the browser' });
  });

  // API endpoints for Period Tracker
  app.get('/api/period', (req, res) => {
    res.json({ message: 'Period tracker data is stored locally in the browser' });
  });

  // API endpoints for Workout Tracker
  app.get('/api/workout', (req, res) => {
    res.json({ message: 'Workout tracker data is stored locally in the browser' });
  });

  // API endpoints for Habit Tracker
  app.get('/api/habits', (req, res) => {
    res.json({ message: 'Habit tracker data is stored locally in the browser' });
  });

  // API endpoints for Budget Tracker
  app.get('/api/budget', (req, res) => {
    res.json({ message: 'Budget tracker data is stored locally in the browser' });
  });

  // API endpoints for Mood Tracker
  app.get('/api/mood', (req, res) => {
    res.json({ message: 'Mood tracker data is stored locally in the browser' });
  });

  // API endpoints for Water Tracker
  app.get('/api/water', (req, res) => {
    res.json({ message: 'Water tracker data is stored locally in the browser' });
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
