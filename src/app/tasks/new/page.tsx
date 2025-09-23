// src/app/tasks/new/page.tsx
// This page lets users create new tasks with priority field.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Sending request to /api/tasks...");
      
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          dueDate: dueDate || null,
        }),
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        router.push("/tasks");
        router.refresh();
      } else {
        // ADD ERROR HANDLING
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          alert(`Error: ${errorData.error || "Something went wrong"}`);
        } catch (jsonError) {
          console.error("Failed to parse JSON error:", jsonError);
          const errorText = await response.text();
          console.error("Raw error response:", errorText);
          alert(`Server error: ${response.status} ${response.statusText}\n${errorText}`);
        }
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <Link href="/tasks" className="text-[var(--turquoise-600)] hover:underline transition-colors">
            &larr; Back to Tasks
          </Link>
          <h1 className="text-3xl font-bold mt-2 text-foreground">Create New Task</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg shadow-md border-theme">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border-theme rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border-theme rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border-theme rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-foreground">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border-theme rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border-theme rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--turquoise-500)] text-white py-2 px-4 rounded-md hover:bg-[var(--turquoise-600)] focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Creating Task..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}