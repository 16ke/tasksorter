"use client";

import { Task } from "@/types/task";
import { getDueDateStatus, getDueDateBadgeColor, getDueDateIcon, getDueDateText } from "@/lib/dateUtils";
import Link from "next/link";
import { useState } from "react";

interface NotificationDashboardProps {
  tasks: Task[];
}

export default function NotificationDashboard({ tasks }: NotificationDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const activeTasks = tasks.filter(task => task.status !== 'DONE');
  
  const tasksWithDueDates = activeTasks.map(task => ({
    ...task,
    dueDateStatus: getDueDateStatus(task.dueDate, task.status)
  }));

  const overdueTasks = tasksWithDueDates.filter(task => task.dueDateStatus.isOverdue);
  const dueTodayTasks = tasksWithDueDates.filter(task => task.dueDateStatus.isDueToday);
  const dueTomorrowTasks = tasksWithDueDates.filter(task => task.dueDateStatus.isDueTomorrow);
  const dueThisWeekTasks = tasksWithDueDates.filter(task => 
    task.dueDateStatus.isDueThisWeek && 
    !task.dueDateStatus.isDueToday && 
    !task.dueDateStatus.isDueTomorrow
  );

  const hasNotifications = overdueTasks.length > 0 || dueTodayTasks.length > 0 || 
                          dueTomorrowTasks.length > 0 || dueThisWeekTasks.length > 0;

  const totalAlerts = overdueTasks.length + dueTodayTasks.length + dueTomorrowTasks.length + dueThisWeekTasks.length;

  if (!hasNotifications) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg mb-8 border-gold-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground font-elegant">📊 Task Overview</h2>
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium border-gold">
            All caught up! 🎉
          </span>
        </div>
        <p className="text-muted font-body">
          You have {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}. No upcoming due dates!
        </p>
      </div>
    );
  }

  const NotificationSection = ({ 
    title, 
    tasks, 
    icon 
  }: { 
    title: string; 
    tasks: typeof tasksWithDueDates; 
    icon: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-4 last:mb-0">
        <h3 className="font-semibold text-foreground mb-2 flex items-center font-elegant">
          <span className="mr-2">{icon}</span>
          {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link 
              key={task.id}
              href={`/tasks/edit/${task.id}`}
              className="block p-3 rounded-lg border border-gold hover:border-[var(--gold-400)] hover:bg-surface transition-all duration-200"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm font-body">{task.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full border border-gold ${getDueDateBadgeColor(task.dueDateStatus.status)}`}>
                      {getDueDateIcon(task.dueDateStatus.status)} {getDueDateText(task.dueDate!, task.dueDateStatus.status, task.dueDateStatus.daysUntilDue)}
                    </span>
                    {task.priority && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border border-gold ${
                        task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                        task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl shadow-lg mb-8 border-gold-lg overflow-hidden">
      {/* Header with Collapse Toggle */}
      <div 
        className="p-6 border-b border-gold cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-foreground font-elegant">🏺 Due Date Alerts</h2>
            <span className="bg-gradient-to-r from-[var(--turquoise-500)] to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium border-gold">
              {totalAlerts} urgent
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href="/notifications"
              className="text-sm text-[var(--turquoise-500)] hover:text-[var(--turquoise-600)] hover:underline font-medium font-body"
              onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking link
            >
              View Details
            </Link>
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-colors border-gold"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
            >
              <svg 
                className={`w-5 h-5 text-muted transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Summary Stats (Always visible) */}
        <div className="flex items-center space-x-4 mt-3 text-sm text-muted font-body">
          <span>⏳ {overdueTasks.length} overdue</span>
          <span>🔔 {dueTodayTasks.length} due today</span>
          <span>📜 {dueTomorrowTasks.length + dueThisWeekTasks.length} upcoming</span>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-6">
          <NotificationSection 
            title="Overdue Tasks" 
            tasks={overdueTasks} 
            icon="⏳" 
          />
          
          <NotificationSection 
            title="Due Today" 
            tasks={dueTodayTasks} 
            icon="🔔" 
          />
          
          <NotificationSection 
            title="Due Tomorrow" 
            tasks={dueTomorrowTasks} 
            icon="⏰" 
          />
          
          <NotificationSection 
            title="Due This Week" 
            tasks={dueThisWeekTasks} 
            icon="📜" 
          />

          {/* Invisible container - borders match background */}
          <div className="mt-4 pt-4 border-t border-transparent">
            <p className="text-sm text-muted font-body text-center">
              Total active tasks: {activeTasks.length} • 
              Completed: {tasks.filter(t => t.status === 'DONE').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}