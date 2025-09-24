// src/app/api/tasks/route.ts - FIXED WITH PROPER TYPES
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TypeScript Interfaces
interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface CategoryRelation {
  category: {
    id: string;
    name: string;
    color?: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface TaskWithCategories {
  id: string;
  title: string;
  description: string | null; // FIXED: Changed from string to string | null
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categories: CategoryRelation[];
}

interface TransformedTask {
  id: string;
  title: string;
  description: string | null; // FIXED: Changed from string to string | null
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categories: {
    id: string;
    name: string;
    color?: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface TaskCreateData {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  categoryIds?: string[];
}

// Type Guards
function isSessionUser(user: any): user is SessionUser {
  return user && typeof user.id === 'string';
}

function isValidTaskCreateData(data: any): data is TaskCreateData {
  return data && typeof data.title === 'string';
}

function isTaskWithCategories(task: any): task is TaskWithCategories {
  return task && typeof task.id === 'string' && Array.isArray(task.categories);
}

// Helper function to transform task data
function transformTask(task: TaskWithCategories): TransformedTask {
  return {
    ...task,
    description: task.description, // FIXED: Keep as string | null
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    categories: task.categories.map((tc: CategoryRelation) => ({
      ...tc.category,
      createdAt: tc.category.createdAt.toISOString(),
      updatedAt: tc.category.updatedAt.toISOString(),
    })),
  };
}

// GET - Fetch all tasks for the current user WITH CATEGORIES
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate cache key for ETag
    const cacheKey = `${session.user.id}-tasks`;
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === cacheKey) {
      return new NextResponse(null, { status: 304 });
    }

    const tasks = await prisma.task.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Type-safe transformation - FIXED: Added proper type assertion
    const tasksWithCategories: TransformedTask[] = tasks.map((task: any) => 
      transformTask(task as TaskWithCategories)
    );

    const response = NextResponse.json({ tasks: tasksWithCategories });
    
    // Set cache headers
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    response.headers.set('ETag', cacheKey);
    
    return response;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// POST - Create a new task with priority AND CATEGORIES
export async function POST(request: NextRequest) {
  try {
    console.log("API: Task creation request received");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      console.log("API: Unauthorized - no valid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("API: JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!isValidTaskCreateData(body)) {
      return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
    }

    const { title, description, status, priority, dueDate, categoryIds = [] } = body;

    // Validate required fields
    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate categories belong to the user if provided
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const userCategories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          userId: session.user.id
        },
        select: {
          id: true
        }
      });

      if (userCategories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: "Some categories do not exist or don't belong to you" },
          { status: 400 }
        );
      }
    }

    // FIXED: Simplified transaction without explicit PrismaClient type
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || "",
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          userId: session.user.id,
        },
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  userId: true,
                  createdAt: true,
                  updatedAt: true,
                }
              }
            }
          }
        }
      });

      // Create category relations if categories are provided
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await tx.taskCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            taskId: newTask.id,
            categoryId: categoryId
          }))
        });

        // Fetch the task again with categories
        const updatedTask = await tx.task.findUnique({
          where: { id: newTask.id },
          include: {
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    userId: true,
                    createdAt: true,
                    updatedAt: true,
                  }
                }
              }
            }
          }
        });

        if (!updatedTask) {
          throw new Error("Failed to fetch created task");
        }

        return updatedTask;
      }

      return newTask;
    });

    if (!task) {
      throw new Error("Failed to create task");
    }

    // FIXED: Remove the type guard and use direct transformation
    const taskWithCategories = transformTask(task as TaskWithCategories);
    
    console.log("API: Task created successfully with categories");
    return NextResponse.json(taskWithCategories, { status: 201 });

  } catch (error: unknown) {
    console.error("API: Unexpected error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}