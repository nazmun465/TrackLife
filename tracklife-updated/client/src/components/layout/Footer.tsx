import { Link } from "wouter";
import { ChartLine } from "lucide-react";
import { FaTwitter, FaFacebook, FaInstagram, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-primary dark:text-primary text-3xl">
                <ChartLine />
              </span>
              <span className="text-gray-900 dark:text-white font-bold text-xl">TrackLife</span>
            </Link>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
              Track, analyze, and improve your life with our comprehensive self-tracking tools.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" aria-label="Twitter">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" aria-label="Facebook">
                <FaFacebook className="text-xl" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" aria-label="Instagram">
                <FaInstagram className="text-xl" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary" aria-label="GitHub">
                <FaGithub className="text-xl" />
              </a>
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Trackers</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/sleep" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Sleep Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/period" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Period Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/workout" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Workout Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/habit" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Habit Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/budget" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Budget Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/mood" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Mood Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/water" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Water Tracker
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} TrackLife. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
