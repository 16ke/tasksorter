// src/app/api/tasks/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Export tasks in various formats (CSV, JSON) with multiple methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const exportMethod = searchParams.get('exportMethod') || 'filtered';
    
    // Get task IDs if exporting selected tasks
    const taskIds = searchParams.getAll('taskIds');
    
    // Get filter parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause based on export method
    const where: any = { 
      userId: session.user.id 
    };

    if (exportMethod === 'selected' && taskIds.length > 0) {
      // Export only selected tasks
      where.id = { in: taskIds };
    } else if (exportMethod === 'filtered') {
      // Apply filters for filtered export
      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (priority && priority !== 'ALL') {
        where.priority = priority;
      }

      if (categoryId && categoryId !== 'ALL') {
        where.categories = {
          some: {
            categoryId: categoryId
          }
        };
      }

      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) {
          where.dueDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.dueDate.lte = new Date(endDate);
        }
      }
    }
    // For 'all' method, no additional filters are applied

    const tasks = await prisma.task.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Transform tasks for export
    const exportTasks = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No due date',
      createdAt: task.createdAt.toISOString().split('T')[0],
      updatedAt: task.updatedAt.toISOString().split('T')[0],
      categories: task.categories.map((tc: any) => tc.category.name).join(', ') || 'Uncategorized',
      daysUntilDue: task.dueDate ? 
        Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        null
    }));

    if (format === 'csv') {
      return generateCSVResponse(exportTasks, exportMethod);
    } else {
      return NextResponse.json({ 
        tasks: exportTasks,
        exportInfo: {
          exportedAt: new Date().toISOString(),
          totalTasks: exportTasks.length,
          exportMethod: exportMethod,
          filters: exportMethod === 'filtered' ? {
            status,
            priority,
            categoryId,
            dateRange: { startDate, endDate }
          } : undefined,
          selectedTaskIds: exportMethod === 'selected' ? taskIds : undefined
        }
      });
    }

  } catch (error) {
    console.error("Error exporting tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateCSVResponse(tasks: any[], exportMethod: string) {
  if (tasks.length === 0) {
    const csv = "No tasks to export";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tasks-empty.csv"'
      }
    });
  }

  const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Categories', 'Days Until Due', 'Created At', 'Updated At'];
  const csvRows = tasks.map(task => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${task.description.replace(/"/g, '""')}"`,
    task.status,
    task.priority,
    task.dueDate,
    `"${task.categories.replace(/"/g, '""')}"`,
    task.daysUntilDue !== null ? task.daysUntilDue : 'No due date',
    task.createdAt,
    task.updatedAt
  ]);

  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const methodSuffix = exportMethod === 'selected' ? 'selected' : exportMethod === 'filtered' ? 'filtered' : 'all';
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tasks-${methodSuffix}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}