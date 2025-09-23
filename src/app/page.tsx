// src/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const pendingTaskCount = await prisma.task.count({
      where: { 
        userId: session.user.id,
        status: { not: "DONE" }
      }
    });

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md border-theme">
          <div>
            <h1 className="text-3xl font-bold text-center text-foreground">
              Welcome back!
            </h1>
            <p className="mt-2 text-center text-muted">
              Hello, {session.user?.name}!
            </p>
          </div>
          
          <div className="bg-[var(--turquoise-50)] dark:bg-[var(--turquoise-950)] p-4 rounded-lg text-center border-theme">
            <p className="text-2xl font-bold text-[var(--turquoise-600)] dark:text-[var(--turquoise-400)]">{pendingTaskCount}</p>
            <p className="text-[var(--turquoise-800)] dark:text-[var(--turquoise-200)]">
              {pendingTaskCount === 1 ? 'task' : 'tasks'} waiting for you
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/tasks"
              className="w-full bg-[var(--turquoise-500)] text-white py-2 px-4 rounded-md hover:bg-[var(--turquoise-600)] focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 block text-center transition-colors"
            >
              View My Tasks
            </Link>
            
            <Link
              href="/tasks/new"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 block text-center transition-colors"
            >
              Create New Task
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md border-theme">
        <div>
          <h1 className="text-3xl font-bold text-center text-foreground">
            Welcome to TaskSorter
          </h1>
          <p className="mt-2 text-center text-muted">
            Your simple and clean task management solution
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full bg-[var(--turquoise-500)] text-white py-2 px-4 rounded-md hover:bg-[var(--turquoise-600)] focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 block text-center transition-colors"
          >
            Sign In
          </Link>
          
          <Link
            href="/register"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 block text-center transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div className="text-center text-sm text-muted">
          <p>Manage your tasks efficiently with our simple tool</p>
        </div>
      </div>
    </div>
  );
}