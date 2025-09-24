// src/app/api/tasks/export/route.ts
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
    name: string;
  };
}

interface TaskWithCategories {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null; // FIX: Changed from string to string | null
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categories: CategoryRelation[];
}

interface ExportTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  categories: string;
  daysUntilDue: number | null;
}

interface ExportFilters {
  status: string | null;
  priority: string | null;
  categoryId: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface ExportInfo {
  exportedAt: string;
  totalTasks: number;
  exportMethod: string;
  filters?: ExportFilters;
  selectedTaskIds?: string[];
}

interface WhereClause {
  userId: string;
  id?: { in: string[] };
  status?: string;
  priority?: string;
  categories?: {
    some: {
      categoryId: string;
    };
  };
  dueDate?: {
    gte?: Date;
    lte?: Date;
  };
}

// Type Guards
function isSessionUser(user: any): user is SessionUser {
  return user && typeof user.id === 'string';
}

function isValidExportMethod(method: string | null): method is 'selected' | 'filtered' | 'all' {
  return method === 'selected' || method === 'filtered' || method === 'all';
}

function isValidFormat(format: string | null): format is 'csv' | 'json' {
  return format === 'csv' || format === 'json';
}

// ETag generation helper
function generateETag(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// GET - Export tasks in various formats (CSV, JSON) with multiple methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const exportMethod = searchParams.get('exportMethod');
    
    const validFormat = isValidFormat(format) ? format : 'json';
    const validExportMethod = isValidExportMethod(exportMethod) ? exportMethod : 'filtered';
    
    // Get task IDs if exporting selected tasks
    const taskIds = searchParams.getAll('taskIds').filter(id => id.length > 0);
    
    // Get filter parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause based on export method
    const where: WhereClause = { 
      userId: session.user.id 
    };

    if (validExportMethod === 'selected' && taskIds.length > 0) {
      where.id = { in: taskIds };
    } else if (validExportMethod === 'filtered') {
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

    const tasks = await prisma.task.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Transform tasks for export - FIX: Handle null priority
    const exportTasks: ExportTask[] = tasks.map((task: TaskWithCategories) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'MEDIUM', // FIX: Provide default value for null priority
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No due date',
      createdAt: task.createdAt.toISOString().split('T')[0],
      updatedAt: task.updatedAt.toISOString().split('T')[0],
      categories: task.categories.map((tc: CategoryRelation) => tc.category.name).join(', ') || 'Uncategorized',
      daysUntilDue: task.dueDate ? 
        Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        null
    }));

    // Generate ETag for caching
    const etag = generateETag(exportTasks);
    const requestEtag = request.headers.get('If-None-Match');
    
    if (requestEtag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const responseHeaders = {
      'ETag': etag,
      'Cache-Control': 'private, max-age=300', // 5 minutes cache
    };

    if (validFormat === 'csv') {
      const csvResponse = generateCSVResponse(exportTasks, validExportMethod);
      Object.entries(responseHeaders).forEach(([key, value]) => {
        csvResponse.headers.set(key, value);
      });
      return csvResponse;
    } else {
      const exportInfo: ExportInfo = {
        exportedAt: new Date().toISOString(),
        totalTasks: exportTasks.length,
        exportMethod: validExportMethod,
        filters: validExportMethod === 'filtered' ? {
          status,
          priority,
          categoryId,
          startDate,
          endDate
        } : undefined,
        selectedTaskIds: validExportMethod === 'selected' ? taskIds : undefined
      };

      const response = NextResponse.json({ 
        tasks: exportTasks,
        exportInfo
      });

      Object.entries(responseHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

  } catch (error) {
    console.error("Error exporting tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

function generateCSVResponse(tasks: ExportTask[], exportMethod: string): NextResponse {
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
    task.daysUntilDue !== null ? task.daysUntilDue.toString() : 'No due date',
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