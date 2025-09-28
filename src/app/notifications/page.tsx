import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Task } from "@/types/task";
import NotificationDashboard from "@/components/NotificationDashboard";

interface PrismaTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categories: {
    category: {
      id: string;
      name: string;
      color: string | null;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
    };
  }[];
}

// Type guards for status and priority
function isValidStatus(status: string): status is 'TODO' | 'IN_PROGRESS' | 'DONE' {
  return ['TODO', 'IN_PROGRESS', 'DONE'].includes(status);
}

function isValidPriority(priority: string): priority is 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority);
}

async function getTaskData(userId: string): Promise<Task[]> {
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

  return tasks.map((task: PrismaTask) => {
    // Validate and transform status
    const validStatus = isValidStatus(task.status) ? task.status : 'TODO';
    
    // Validate and transform priority
    const validPriority = task.priority && isValidPriority(task.priority) 
      ? task.priority 
      : 'MEDIUM';

    // Transform category colors (handle null)
    const categories = task.categories.map((tc) => ({
      ...tc.category,
      color: tc.category.color || '#6B7280', // Default gray color
      createdAt: tc.category.createdAt.toISOString(),
      updatedAt: tc.category.updatedAt.toISOString(),
    }));

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: validStatus,
      priority: validPriority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      userId: task.userId,
      categories
    };
  });
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-card rounded-xl shadow-lg p-8 border-gold-lg">
          <h1 className="text-2xl font-bold text-foreground mb-4 font-elegant">Access Denied</h1>
          <p className="text-muted mb-4 font-body">Please sign in to view your notifications.</p>
          <Link 
            href="/login"
            className="bg-[var(--turquoise-500)] text-white px-6 py-2 rounded-lg hover:bg-[var(--turquoise-600)] transition-colors border border-gold-lg font-body"
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">
              🔔 Notifications Center
            </h1>
            <p className="text-white mt-2 font-body">Stay on top of your tasks and deadlines</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-[var(--turquoise-500)] to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-gold-lg font-body">
              {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
            </div>
            <Link 
              href="/tasks"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium border border-gold-lg font-body"
            >
              View All Tasks
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-4 rounded-xl border-gold-lg text-center">
            <div className="text-2xl font-bold text-foreground font-elegant">{tasks.length}</div>
            <div className="text-sm text-muted font-body">Total Tasks</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-gold-lg text-center">
            <div className="text-2xl font-bold text-green-500 font-elegant">{completedTasks.length}</div>
            <div className="text-sm text-muted font-body">Completed</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-gold-lg text-center">
            <div className="text-2xl font-bold text-orange-500 font-elegant">{activeTasks.length}</div>
            <div className="text-sm text-muted font-body">Active</div>
          </div>
          <div className="bg-card p-4 rounded-xl border-gold-lg text-center">
            <div className="text-2xl font-bold text-[var(--turquoise-500)] font-elegant">
              {tasks.filter(t => t.priority === 'URGENT').length}
            </div>
            <div className="text-sm text-muted font-body">Urgent</div>
          </div>
        </div>

        {/* Notification Dashboard */}
        <NotificationDashboard tasks={tasks} />

        {/* Quick Actions */}
        <div className="bg-card p-6 rounded-xl shadow-lg border-gold-lg">
          <h2 className="text-2xl font-bold text-foreground mb-4 font-elegant">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/tasks/new"
              className="bg-gradient-to-r from-[var(--turquoise-500)] to-[var(--turquoise-600)] text-white p-4 rounded-lg text-center hover:from-[var(--turquoise-600)] hover:to-[var(--turquoise-700)] transition-all duration-200 shadow-lg hover:shadow-xl border border-gold-lg"
            >
              <div className="text-2xl mb-2">✍️</div>
              <div className="font-medium font-body">New Task</div>
            </Link>
            <Link 
              href="/tasks"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-gold-lg"
            >
              <div className="text-2xl mb-2">📜</div>
              <div className="font-medium font-body">All Tasks</div>
            </Link>
            <Link 
              href="/categories"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-gold-lg"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <div className="font-medium font-body">Categories</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-xl shadow-lg border-gold-lg mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 font-elegant">📊 Recent Activity</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors border-gold-lg">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full border border-gold-lg ${
                    task.status === 'DONE' ? 'bg-green-500' : 
                    task.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="font-medium text-foreground font-body">{task.title}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted font-body">
                  <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                  <Link 
                    href={`/tasks/edit/${task.id}`}
                    className="text-[var(--turquoise-500)] hover:text-[var(--turquoise-600)] transition-colors font-body"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted font-body">
              No tasks yet. <Link href="/tasks/new" className="text-[var(--turquoise-500)] hover:underline">Create your first task!</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}