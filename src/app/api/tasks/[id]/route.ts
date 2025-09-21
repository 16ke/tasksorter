// src/app/api/tasks/[id]/route.ts
// This API route handles getting, updating, and deleting individual tasks.

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

    // Type assertion to handle our custom session type
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
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

    // Type assertion to handle our custom session type
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const { title, description, status, priority, dueDate } = await request.json();

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

    // Update the task
    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description: description || "",
        status: status || "TODO",
        priority: priority || "MEDIUM", // Add priority field
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(task);
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

    // Type assertion to handle our custom session type
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

    // Delete the task
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