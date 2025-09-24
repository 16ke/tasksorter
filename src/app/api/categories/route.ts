import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// TypeScript Interfaces
interface SessionUser {
  email: string;
  id?: string;
  name?: string;
}

interface CategoryCreateData {
  name: string;
  color?: string;
}

interface TransformedCategory {
  id: string;
  name: string;
  color: string;
  userId: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PrismaCategory {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: { taskId: string }[];
}

// Type Guards
function isSessionUser(obj: unknown): obj is SessionUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'email' in obj &&
    typeof (obj as SessionUser).email === 'string'
  );
}

function isValidCategoryCreateData(obj: unknown): obj is CategoryCreateData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as CategoryCreateData).name === 'string'
  );
}

// Helper function to generate ETag
function generateETag(data: unknown): string {
  const jsonString = JSON.stringify(data);
  return Buffer.from(jsonString).toString('base64');
}

// Helper function to transform category data
function transformCategory(category: PrismaCategory): TransformedCategory {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    userId: category.userId,
    taskCount: category.tasks.length,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Fetch categories with only necessary fields
    const categories = await prisma.category.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          select: {
            taskId: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const transformedCategories = categories.map(transformCategory);

    // Generate ETag for caching
    const etag = generateETag(transformedCategories);
    
    // Check If-None-Match header for cache validation
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = NextResponse.json({ 
      categories: transformedCategories 
    });

    // Set cache headers
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!isValidCategoryCreateData(body)) {
      return NextResponse.json(
        { error: 'Invalid category data. Name is required.' },
        { status: 400 }
      );
    }

    const { name, color } = body;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Get user with only necessary fields
      const user = await tx.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create category
      const category = await tx.category.create({
        data: {
          name: name.trim(),
          color: color?.trim() || '#3b82f6',
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          color: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return category;
    });

    // Transform response with taskCount
    const categoryWithTaskCount: TransformedCategory = {
      id: result.id,
      name: result.name,
      color: result.color,
      userId: result.userId,
      taskCount: 0,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    const response = NextResponse.json(
      { category: categoryWithTaskCount }, 
      { status: 201 }
    );

    // Invalidate cache for categories list
    response.headers.set('Cache-Control', 'no-cache');

    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}