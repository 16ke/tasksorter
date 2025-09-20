// src/app/tasks/page.tsx
// This page now checks if you're logged in. If not, it shows an error.

import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const user = await getCurrentUser();

  // If user is not logged in, redirect to login page
  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <p className="text-gray-600">Welcome back, {user.name}! Your tasks will appear here soon.</p>
      {/* We'll add a list of tasks here later */}
    </div>
  );
}