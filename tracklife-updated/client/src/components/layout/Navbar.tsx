import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, X, ChartLine, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleMobileSubmenu = () => {
    setIsMobileSubmenuOpen(!isMobileSubmenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 py-3 md:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-primary dark:text-primary text-3xl">
                <ChartLine />
              </span>
              <span className="text-gray-900 dark:text-white font-bold text-xl">TrackLife</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/' ? 'text-primary dark:text-primary' : ''}`}>
              Dashboard
            </Link>
            <Link href="/sleep" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/sleep' ? 'text-primary dark:text-primary' : ''}`}>
              Sleep
            </Link>
            <Link href="/period" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/period' ? 'text-primary dark:text-primary' : ''}`}>
              Period
            </Link>
            <Link href="/workout" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/workout' ? 'text-primary dark:text-primary' : ''}`}>
              Workout
            </Link>
            <Link href="/habit" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/habit' ? 'text-primary dark:text-primary' : ''}`}>
              Habit
            </Link>
            <Link href="/budget" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/budget' ? 'text-primary dark:text-primary' : ''}`}>
              Budget
            </Link>
            <Link href="/mood" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/mood' ? 'text-primary dark:text-primary' : ''}`}>
              Mood
            </Link>
            <Link href="/water" className={`text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium ${location === '/water' ? 'text-primary dark:text-primary' : ''}`}>
              Water
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div className={`md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Dashboard
          </Link>
          <Link href="/sleep" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/sleep' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Sleep Tracker
          </Link>
          <Link href="/period" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/period' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Period Tracker
          </Link>
          <Link href="/workout" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/workout' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Workout Tracker
          </Link>
          <Link href="/habit" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/habit' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Habit Tracker
          </Link>
          <Link href="/budget" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/budget' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Budget Tracker
          </Link>
          <Link href="/mood" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/mood' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Mood Tracker
          </Link>
          <Link href="/water" className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${location === '/water' ? 'text-primary dark:text-primary' : 'text-gray-900 dark:text-white'}`}>
            Water Tracker
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
