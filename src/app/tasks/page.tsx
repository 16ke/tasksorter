// src/app/tasks/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        if (response.ok) {
          const tasksData = await response.json();
          setTasks(tasksData.tasks || []);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleMarkAsDone = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "DONE",
        }),
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: "DONE" } : task
        ));
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to mark as done"}`);
      }
    } catch (error) {
      console.error("Error marking task as done:", error);
      alert("Failed to mark task as done.");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId));
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete task"}`);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = task.status === "TODO" || task.status === "IN_PROGRESS";
      } else if (statusFilter !== "") {
        matchesStatus = task.status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tasks, searchTerm, statusFilter, sortBy]);

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent">
                My Tasks
              </h1>
            </div>
            <div className="bg-gray-300 text-gray-500 px-6 py-3 rounded-full animate-pulse">
              + New Task
            </div>
          </div>
          
          <div className="grid gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-card p-6 rounded-xl shadow-lg animate-pulse border-theme">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-7 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="flex items-center mt-4 space-x-3">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex space-x-3 ml-6">
                    <div className="h-9 bg-gray-200 rounded-full w-9"></div>
                    <div className="h-9 bg-gray-200 rounded-full w-9"></div>
                    <div className="h-9 bg-gray-200 rounded-full w-9"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="text-muted mt-2">Manage your tasks efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-gradient-to-r from-[var(--turquoise-500)] to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
            </span>
            <Link 
              href="/tasks/new"
              className="bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white px-6 py-3 rounded-full hover:from-[var(--turquoise-700)] hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
            >
              + New Task
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-card p-6 rounded-xl shadow-lg mb-8 border-theme">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                🔍 Search Tasks
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border-theme rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 bg-card text-foreground"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                  📊 Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border-theme rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 text-sm bg-card text-foreground"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-foreground mb-2">
                  🔄 Sort
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border-theme rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 text-sm bg-card text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="dueDate">Due Date</option>
                  <option value="title">A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl shadow-lg border-theme">
            <div className="text-8xl mb-6">📋</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {tasks.length === 0 ? "No tasks yet!" : "No tasks found"}
            </h3>
            <p className="text-muted text-lg mb-8 max-w-md mx-auto">
              {tasks.length === 0 
                ? "Get started by creating your first task to stay organized and productive!" 
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {tasks.length === 0 ? (
              <Link 
                href="/tasks/new"
                className="bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white px-8 py-3 rounded-full hover:from-[var(--turquoise-700)] hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium inline-block"
              >
                Create Your First Task
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAndSortedTasks.map((task) => (
              <div key={task.id} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-theme hover:border-[var(--turquoise-200)]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-foreground pr-4">{task.title}</h3>
                      {task.priority && (
                        <span className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-full border ${
                          task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                          task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-muted mb-4 text-sm leading-relaxed">{task.description}</p>
                    )}
                    
                    <div className="flex items-center flex-wrap gap-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                        task.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      
                      {task.dueDate && (
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center space-x-1 ${
                          isOverdue(task.dueDate, task.status) 
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' 
                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        }`}>
                          <span>📅</span>
                          <span>{isOverdue(task.dueDate, task.status) ? 'Overdue: ' : 'Due: '}</span>
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                      
                      <span className="text-xs text-muted">
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-6">
                    {task.status !== 'DONE' && (
                      <button
                        onClick={() => handleMarkAsDone(task.id)}
                        className="bg-gray-100 text-gray-500 p-2 rounded-full text-sm hover:bg-green-100 hover:text-green-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-green-900/30 dark:hover:text-green-300 transition-all duration-200 hover:scale-110 flex items-center justify-center"
                        title="Mark as done"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/tasks/edit/${task.id}`)}
                      className="bg-blue-100 text-blue-600 p-2 rounded-full text-sm hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-110"
                      title="Edit task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="bg-red-100 text-red-600 p-2 rounded-full text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-110"
                      title="Delete task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}