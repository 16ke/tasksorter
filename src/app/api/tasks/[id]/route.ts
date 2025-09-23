// src/app/api/tasks/[id]/route.ts
// FIXED: Now handles categories properly in GET, PUT, and DELETE

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Transform the data to include categories directly
    const taskWithCategories = {
      ...task,
      categories: task.categories.map((tc: any) => tc.category),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };

    return NextResponse.json(taskWithCategories);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const { title, description, status, priority, dueDate, categoryIds = [] } = await request.json();

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate categories belong to the user
    if (categoryIds.length > 0) {
      const userCategories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          userId: userId
        }
      });

      if (userCategories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: "Some categories do not exist or don't belong to you" },
          { status: 400 }
        );
      }
    }

    // Update the task with categories
    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description: description || "",
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        // Update categories by recreating the relationships
        categories: {
          // First delete all existing category connections
          deleteMany: {},
          // Then create new ones with the provided categoryIds
          create: categoryIds.map((categoryId: string) => ({
            category: {
              connect: {
                id: categoryId
              }
            }
          }))
        }
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

    return NextResponse.json(taskWithCategories);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete the task (Prisma will handle the category relationships due to onDelete: Cascade)
    await prisma.task.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}