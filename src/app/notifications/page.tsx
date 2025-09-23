import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Task } from "@/types/task";
import NotificationDashboard from "@/components/NotificationDashboard";

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

  return tasks.map((task: any) => ({
    ...task,
    categories: task.categories.map((tc: any) => tc.category)
  })) as Task[];
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted mb-4">Please sign in to view your notifications.</p>
          <Link 
            href="/login"
            className="bg-[var(--turquoise-500)] text-white px-6 py-2 rounded-lg hover:bg-[var(--turquoise-600)] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tasks = await getTaskData(session.user.id);
  const activeTasks = tasks.filter(task => task.status !== 'DONE');
  const completedTasks = tasks.filter(task => task.status === 'DONE');

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent">
              🔔 Notifications Center
            </h1>
            <p className="text-muted mt-2">Stay on top of your tasks and deadlines</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-[var(--turquoise-500)] to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
            </div>
            <Link 
              href="/tasks"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              View All Tasks
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-4 rounded-xl border-theme text-center">
            <div className="text-2xl font-bold text-foreground">{tasks.length}</div>
            <div className="text-sm text-muted">Total Tasks</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-theme text-center">
            <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
            <div className="text-sm text-muted">Completed</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-theme text-center">
            <div className="text-2xl font-bold text-orange-500">{activeTasks.length}</div>
            <div className="text-sm text-muted">Active</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-theme text-center">
            <div className="text-2xl font-bold text-[var(--turquoise-500)]">
              {tasks.filter(t => t.priority === 'URGENT').length}
            </div>
            <div className="text-sm text-muted">Urgent</div>
          </div>
        </div>

        {/* Notification Dashboard */}
        <NotificationDashboard tasks={tasks} />

        {/* Quick Actions */}
        <div className="bg-card p-6 rounded-xl shadow-lg border-theme">
          <h2 className="text-2xl font-bold text-foreground mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/tasks/new"
              className="bg-gradient-to-r from-[var(--turquoise-500)] to-[var(--turquoise-600)] text-white p-4 rounded-lg text-center hover:from-[var(--turquoise-600)] hover:to-[var(--turquoise-700)] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="text-2xl mb-2">➕</div>
              <div className="font-medium">New Task</div>
            </Link>
            <Link 
              href="/tasks"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">All Tasks</div>
            </Link>
            <Link 
              href="/categories"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <div className="font-medium">Categories</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-xl shadow-lg border-theme mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">📊 Recent Activity</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border-theme rounded-lg hover:bg-surface transition-colors">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${
                    task.status === 'DONE' ? 'bg-green-500' : 
                    task.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="font-medium text-foreground">{task.title}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted">
                  <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                  <Link 
                    href={`/tasks/edit/${task.id}`}
                    className="text-[var(--turquoise-500)] hover:text-[var(--turquoise-600)] transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted">
              No tasks yet. <Link href="/tasks/new" className="text-[var(--turquoise-500)] hover:underline">Create your first task!</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}