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
        <li><Link href="/" className="hover:underline">Home</Link></li>
        <li><Link href="/tasks" className="hover:underline">My Tasks</Link></li>
        
        {session ? (
          <>
            <li><Link href="/categories" className="hover:underline">Categories</Link></li>
            
            {/* Notifications Link with Badge */}
            <li className="relative">
              <Link 
                href="/notifications" 
                className="hover:underline flex items-center space-x-1 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Alerts</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            </li>
            
            <li>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </li>
            <li className="text-sm bg-white/20 px-3 py-1 rounded">
              Hello, {session.user?.name}
            </li>
            <li>
              <button 
                onClick={() => signOut()}
                className="bg-white text-[var(--turquoise-600)] px-3 py-1 rounded text-sm hover:bg-gray-100"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link 
              href="/login" 
              className="hover:underline bg-white text-[var(--turquoise-600)] px-3 py-1 rounded text-sm"
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}