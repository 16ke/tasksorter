"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Category } from "@/types/task";
import CategoryModal from "@/components/CategoryModal";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export default function EditTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, taskResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/tasks/${taskId}`)
        ]);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }

        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          setTask(taskData);
          setTitle(taskData.title);
          setDescription(taskData.description || "");
          setStatus(taskData.status);
          setPriority(taskData.priority || "MEDIUM");
          setDueDate(taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : "");
          
          if (taskData.categories && Array.isArray(taskData.categories)) {
            setSelectedCategories(taskData.categories.map((cat: Category) => cat.id));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    setSelectedCategories(prev => [...prev, newCategory.id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          dueDate: dueDate || null,
          categoryIds: selectedCategories,
        }),
      });

      if (response.ok) {
        router.push("/tasks");
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto p-4">
          <div className="mb-6">
            <Link href="/tasks" className="text-[var(--turquoise-600)] hover:underline transition-colors font-body">
              &larr; Back to Tasks
            </Link>
            <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">Loading Task...</h1>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md border-gold-lg animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto p-4">
          <div className="mb-6">
            <Link href="/tasks" className="text-[var(--turquoise-600)] hover:underline transition-colors font-body">
              &larr; Back to Tasks
            </Link>
            <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">Edit Task</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-md border-gold-lg">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2 font-body">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground border-gold-lg font-body"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2 font-body">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground border-gold-lg font-body"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2 font-body">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground border-gold-lg font-body"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2 font-body">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground border-gold-lg font-body"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-2 font-body">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-colors bg-card text-foreground border-gold-lg font-body"
              />
            </div>

            {/* Enhanced Categories Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-foreground font-body">
                  🏷️ Categories
                </label>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm bg-[var(--turquoise-500)] text-white px-3 py-1 rounded-md hover:bg-[var(--turquoise-600)] transition-colors border border-gold-lg font-body"
                >
                  + New Category
                </button>
              </div>
              
              {categoriesLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20 border-gold-lg"></div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gold-lg rounded-lg">
                  <p className="text-muted text-sm mb-2 font-body">No categories yet</p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-[var(--turquoise-600)] hover:underline text-sm font-medium font-body"
                  >
                    Create your first category →
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`px-3 py-2 text-sm font-medium rounded-full border transition-all duration-200 flex items-center space-x-2 font-body ${
                        selectedCategories.includes(category.id)
                          ? 'text-white shadow-lg scale-105'
                          : 'bg-card text-foreground hover:shadow-md border-gold-lg'
                      }`}
                      style={
                        selectedCategories.includes(category.id)
                          ? {
                              backgroundColor: category.color,
                              borderColor: category.color
                            }
                          : {}
                      }
                    >
                      <span>🏷️</span>
                      <span>{category.name}</span>
                      {selectedCategories.includes(category.id) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {categories.length > 0 && (
                <p className="text-xs text-muted mt-2 font-body">
                  {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : ''} selected
                </p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white py-3 px-4 rounded-md hover:from-[var(--turquoise-700)] hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl font-medium border border-gold-lg font-body"
              >
                {isLoading ? "Updating Task..." : "Update Task"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/tasks")}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-medium border border-gold-lg font-body"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
        existingCategories={categories}
      />
    </>
  );
}