"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navigation() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    setDarkMode(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  // Fetch notification count when user is authenticated
  useEffect(() => {
    if (session) {
      const fetchNotificationCount = async () => {
        try {
          const response = await fetch('/api/tasks');
          if (response.ok) {
            const data = await response.json();
            const tasks = data.tasks || [];
            
            // Calculate urgent notifications (overdue + due today + urgent priority)
            const urgentCount = tasks.filter((task: any) => {
              if (task.status === 'DONE') return false;
              
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              if (!dueDate) return task.priority === 'URGENT';
              
              const today = new Date();
              const isOverdue = dueDate < today && dueDate.toDateString() !== today.toDateString();
              const isDueToday = dueDate.toDateString() === today.toDateString();
              
              return isOverdue || isDueToday || task.priority === 'URGENT';
            }).length;
            
            setNotificationCount(urgentCount);
          }
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      };

      fetchNotificationCount();
    }
  }, [session]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    const theme = newDarkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  if (isLoading) {
    return <div className="text-sm">Loading...</div>;
  }

  return (
    <nav>
      <ul className="flex space-x-6 items-center">
        <li>
          <Link href="/" className="hover:underline font-elegant font-medium text-lg transition-all duration-200 hover:text-gold-200">
            Home
          </Link>
        </li>
        <li>
          <Link href="/tasks" className="hover:underline font-elegant font-medium text-lg transition-all duration-200 hover:text-gold-200">
            My Tasks
          </Link>
        </li>
        
        {session ? (
          <>
            <li>
              <Link href="/categories" className="hover:underline font-elegant font-medium text-lg transition-all duration-200 hover:text-gold-200">
                Categories
              </Link>
            </li>
            
            {/* Notifications Link with Badge - ACTUAL horn icon */}
            <li className="relative">
              <Link 
                href="/notifications" 
                className="hover:underline flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group border-gold border-opacity-0 hover:border-opacity-50"
              >
                {/* ACTUAL horn icon - simple and recognizable */}
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <span className="font-elegant font-medium">Alerts</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-gold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            </li>
            
            {/* Dark Mode Toggle with PROPER sun/moon icons */}
            <li>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 border-gold border-opacity-0 hover:border-opacity-50"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  // ACTUAL sun icon - clear and recognizable
                  <svg className="w-5 h-5 text-gold-300 transform hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  // ACTUAL moon icon - clear and recognizable
                  <svg className="w-5 h-5 text-blue-100 transform hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </li>
            
            {/* User greeting with elegant styling */}
            <li className="text-sm bg-white/20 px-3 py-1 rounded border-gold font-elegant">
              Hello, {session.user?.name}
            </li>
            
            {/* Logout button with gold accents */}
            <li>
              <button 
                onClick={() => signOut()}
                className="bg-white text-[var(--turquoise-600)] px-4 py-2 rounded text-sm hover:bg-gold-50 transition-all duration-200 border-gold hover:border-gold-md shadow-gold hover:shadow-gold-lg font-elegant font-medium"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link 
              href="/login" 
              className="hover:underline bg-white text-[var(--turquoise-600)] px-4 py-2 rounded text-sm transition-all duration-200 hover:bg-gold-50 border-gold hover:border-gold-md shadow-gold hover:shadow-gold-lg font-elegant font-medium"
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}          