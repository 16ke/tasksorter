// src/app/api/tasks/route.ts - FIXED WITH PROPER TYPES
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all tasks for the current user WITH CATEGORIES
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include categories directly
    const tasksWithCategories = tasks.map((task: any) => ({
      ...task,
      categories: task.categories.map((tc: any) => tc.category),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }));
    
    return NextResponse.json({ tasks: tasksWithCategories });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new task with priority AND CATEGORIES
export async function POST(request: NextRequest) {
  try {
    console.log("API: Task creation request received");
    
    // Check if we can get a session
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("API: Session:", session);
      console.log("API: User ID from session:", session?.user?.id);
    } catch (sessionError) {
      console.error("API: Session error:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 500 });
    }

    if (!session?.user) {
      console.log("API: Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DEBUG: Check if user ID exists in session
    if (!session.user.id) {
      console.log("API: ERROR - No user ID in session object");
      console.log("API: Full session object:", JSON.stringify(session, null, 2));
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("API: Request body:", body);
    } catch (parseError) {
      console.error("API: JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, description, status, priority, dueDate, categoryIds = [] } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate categories belong to the user
    if (categoryIds.length > 0) {
      const userCategories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          userId: session.user.id
        }
      });

      if (userCategories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: "Some categories do not exist or don't belong to you" },
          { status: 400 }
        );
      }
    }

    // Create the task with categories
    try {
      const task = await prisma.task.create({
        data: {
          title,
          description: description || "",
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          user: {
            connect: {
              id: session.user.id,
            },
          },
          categories: categoryIds.length > 0 ? {
            create: categoryIds.map((categoryId: string) => ({
              category: {
                connect: {
                  id: categoryId
                }
              }
            }))
          } : undefined
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });

      // Transform the response to include categories directly
      const taskWithCategories = {
        ...task,
        categories: task.categories.map((tc: any) => tc.category),
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      };

      console.log("API: Task created successfully with categories:", taskWithCategories);
      return NextResponse.json(taskWithCategories, { status: 201 });
    } catch (dbError: any) {
      console.error("API: Database error:", dbError);
      return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("API: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}