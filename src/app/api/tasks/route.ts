// src/app/api/tasks/route.ts - COMPLETE FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all tasks for the current user
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
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new task with priority
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

    const { title, description, status, priority, dueDate } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create the task
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
        },
      });

      console.log("API: Task created successfully:", task);
      return NextResponse.json(task, { status: 201 });
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