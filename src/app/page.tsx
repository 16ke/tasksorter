import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Task } from "@/types/task";
import LargeLogo from "@/components/LargeLogo";

// Server component to fetch task data for notifications
async function getTaskData(userId: string) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform the data to match frontend expectations
  return tasks.map((task: any) => ({
    ...task,
    categories: task.categories.map((tc: any) => tc.category)
  })) as Task[];
}

// Utility function for due date calculations (server-side compatible)
function getDueDateStatus(dueDate: Date | null, status: string) {
  if (!dueDate || status === 'DONE') {
    return { isOverdue: false, isDueToday: false, isDueTomorrow: false, isDueThisWeek: false, status: 'no-due-date' };
  }

  const due = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const isOverdue = due < today && due.toDateString() !== today.toDateString();
  const isDueToday = due.toDateString() === today.toDateString();
  const isDueTomorrow = due.toDateString() === tomorrow.toDateString();
  const isDueThisWeek = due <= endOfWeek && due >= today;

  let statusType = 'due-future';
  if (isOverdue) statusType = 'overdue';
  else if (isDueToday) statusType = 'due-today';
  else if (isDueTomorrow) statusType = 'due-tomorrow';
  else if (isDueThisWeek) statusType = 'due-this-week';

  return { isOverdue, isDueToday, isDueTomorrow, isDueThisWeek, status: statusType };
}

// Notification widget component
function NotificationWidget({ tasks }: { tasks: Task[] }) {
  const activeTasks = tasks.filter(task => task.status !== 'DONE');
  
  const overdueTasks = activeTasks.filter(task => 
    getDueDateStatus(task.dueDate ? new Date(task.dueDate) : null, task.status).isOverdue
  );
  const dueTodayTasks = activeTasks.filter(task => 
    getDueDateStatus(task.dueDate ? new Date(task.dueDate) : null, task.status).isDueToday
  );
  const urgentTasks = activeTasks.filter(task => task.priority === 'URGENT' && task.status !== 'DONE');

  const totalAlerts = overdueTasks.length + dueTodayTasks.length + urgentTasks.length;

  if (totalAlerts === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 border-gold p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200 font-elegant">🎉 All caught up!</p>
            <p className="text-sm text-green-600 dark:text-green-300 font-body">No urgent tasks or due dates</p>
          </div>
          <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium border-gold">
            {activeTasks.length} active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 border-gold p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-orange-800 dark:text-orange-200 flex items-center font-elegant">
          <span className="mr-2">🏺</span>
          Task Alerts
        </h3>
        <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium border-gold">
          {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-1 text-sm font-body">
        {overdueTasks.length > 0 && (
          <p className="text-red-600 dark:text-red-300">⏳ {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}</p>
        )}
        {dueTodayTasks.length > 0 && (
          <p className="text-orange-600 dark:text-orange-300">🔔 {dueTodayTasks.length} due today</p>
        )}
        {urgentTasks.length > 0 && (
          <p className="text-purple-600 dark:text-purple-300">⚡ {urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</p>
        )}
      </div>
      
      <Link 
        href="/notifications"
        className="block mt-3 text-center bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-700 py-1 rounded text-sm font-medium transition-colors border-gold"
      >
        View Details
      </Link>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const [pendingTaskCount, allTasks] = await Promise.all([
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: { not: "DONE" }
        }
      }),
      getTaskData(session.user.id)
    ]);

    const completedTaskCount = await prisma.task.count({
      where: { 
        userId: session.user.id,
        status: "DONE"
      }
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Welcome Card */}
          <div className="bg-card rounded-xl shadow-lg p-6 border-gold-lg">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent font-elegant">
                Welcome back!
              </h1>
              <p className="mt-2 text-muted font-body">
                Hello, {session.user?.name || session.user?.email}!
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[var(--turquoise-500)] to-[var(--turquoise-600)] text-white p-4 rounded-lg text-center border-gold">
                <p className="text-2xl font-bold font-elegant">{pendingTaskCount}</p>
                <p className="text-sm opacity-90 font-body">Pending</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center border-gold">
                <p className="text-2xl font-bold font-elegant">{completedTaskCount}</p>
                <p className="text-sm opacity-90 font-body">Completed</p>
              </div>
            </div>

            {/* Notifications Widget */}
            <NotificationWidget tasks={allTasks} />

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <Link
                href="/tasks"
                className="w-full bg-gradient-to-r from-[var(--turquoise-500)] to-[var(--turquoise-600)] text-white py-3 px-4 rounded-lg hover:from-[var(--turquoise-600)] hover:to-[var(--turquoise-700)] focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 block text-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl border-gold-md font-body"
              >
                📜 View All Tasks
              </Link>
              
              <Link
                href="/tasks/new"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 block text-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl border-gold-md font-body"
              >
                ✍️ Create New Task
              </Link>

              <Link
                href="/notifications"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 block text-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl border-gold-md font-body"
              >
                🔔 Notifications Center
              </Link>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="text-center text-sm text-muted font-body">
            <p>You have {allTasks.length} total tasks • {Math.round((completedTaskCount / allTasks.length) * 100) || 0}% completed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-card rounded-xl shadow-lg p-8 border-gold-lg">
        <div className="text-center">
          {/* Large Logo */}
          <LargeLogo />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent font-elegant">
            Vezir
          </h1>
          <p className="mt-2 text-muted text-lg font-body">
            Your sagacious task manager
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full bg-gradient-to-r from-[var(--turquoise-500)] to-[var(--turquoise-600)] text-white py-3 px-4 rounded-lg hover:from-[var(--turquoise-600)] hover:to-[var(--turquoise-700)] focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 block text-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl border-gold-md font-body"
          >
            🗝️ Sign In
          </Link>
          
          <Link
            href="/register"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 block text-center transition-all duration-200 font-medium shadow-lg hover:shadow-xl border-gold-md font-body"
          >
            🏛️ Create Account
          </Link>
        </div>

        <div className="text-center text-sm text-muted space-y-2 font-body">
          <p className="flex items-center justify-center space-x-2">
            <span>📜</span>
            <span>Smart due date tracking</span>
          </p>
          <p className="flex items-center justify-center space-x-2">
            <span>🏷️</span>
            <span>Category organization</span>
          </p>
          <p className="flex items-center justify-center space-x-2">
            <span>🏺</span>
            <span>Priority notifications</span>
          </p>
        </div>
      </div>
    </div>
  );
}