import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Dashboard from "@/pages/Dashboard";
import SleepTracker from "@/pages/SleepTracker";
import PeriodTracker from "@/pages/PeriodTracker";
import WorkoutTracker from "@/pages/WorkoutTracker";
import HabitTracker from "@/pages/HabitTracker";
import BudgetTracker from "@/pages/BudgetTracker";
import MoodTracker from "@/pages/MoodTracker";
import WaterTracker from "@/pages/WaterTracker";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Dashboard}/>
          <Route path="/sleep" component={SleepTracker}/>
          <Route path="/period" component={PeriodTracker}/>
          <Route path="/workout" component={WorkoutTracker}/>
          <Route path="/habit" component={HabitTracker}/>
          <Route path="/budget" component={BudgetTracker}/>
          <Route path="/mood" component={MoodTracker}/>
          <Route path="/water" component={WaterTracker}/>
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="tracklife-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
