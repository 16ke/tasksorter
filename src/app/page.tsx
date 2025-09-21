// src/app/page.tsx
// This homepage shows different content based on login status

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If logged in, show personalized dashboard
  if (session) {
    // Count only NON-DONE tasks (exclude completed tasks)
    const pendingTaskCount = await prisma.task.count({
      where: { 
        userId: session.user.id,
        status: {
          not: "DONE" // Only count tasks that are NOT done
        }
      }
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h1 className="text-3xl font-bold text-center text-gray-900">
              Welcome back!
            </h1>
            <p className="mt-2 text-center text-gray-600">
              Hello, {session.user?.name}!
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{pendingTaskCount}</p>
            <p className="text-blue-800">
              {pendingTaskCount === 1 ? 'task' : 'tasks'} waiting for you
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/tasks"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block text-center transition-colors"
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

  // If not logged in, show welcome page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Welcome to TaskSorter
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Your simple and clean task management solution
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block text-center transition-colors"
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

        <div className="text-center text-sm text-gray-500">
          <p>Manage your tasks efficiently with our simple tool</p>
        </div>
      </div>
    </div>
  );
}