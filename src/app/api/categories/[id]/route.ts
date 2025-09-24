import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// TypeScript Interfaces
interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

interface CategoryResponse {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// Type Guards
function isSessionUser(user: any): user is SessionUser {
  return user && typeof user.id === 'string' && typeof user.email === 'string';
}

// Helper function to generate ETag
function generateETag(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// GET - Fetch single category with task count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CategoryResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = params.id;

    // Fetch category with task count
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        user: {
          email: session.user.email
        }
      },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          select: {
            id: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Transform data with task count
    const categoryResponse: CategoryResponse = {
      id: category.id,
      name: category.name,
      color: category.color,
      taskCount: category.tasks.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    // ETag for caching
    const etag = generateETag(categoryResponse);
    const requestETag = request.headers.get('If-None-Match');

    if (requestETag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = NextResponse.json(categoryResponse);
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Error fetching category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CategoryResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = params.id;
    const body = await request.json();

    // Validate request body
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (!body.color || typeof body.color !== 'string') {
      return NextResponse.json({ error: 'Category color is required' }, { status: 400 });
    }

    // Verify the category belongs to the user and update
    const updatedCategory = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const category = await tx.category.findFirst({
        where: {
          id: categoryId,
          user: {
            email: session.user.email
          }
        }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return await tx.category.update({
        where: { id: categoryId },
        data: {
          name: body.name.trim(),
          color: body.color
        },
        select: {
          id: true,
          name: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          tasks: {
            select: {
              id: true
            }
          }
        }
      });
    });

    // Transform response
    const categoryResponse: CategoryResponse = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      color: updatedCategory.color,
      taskCount: updatedCategory.tasks.length,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt
    };

    return NextResponse.json(categoryResponse);

  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error instanceof Error && error.message === 'Category not found') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Remove category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ message: string } | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = params.id;

    // Verify the category belongs to the user and delete with transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const category = await tx.category.findFirst({
        where: {
          id: categoryId,
          user: {
            email: session.user.email
          }
        }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category has tasks
      const taskCount = await tx.taskCategory.count({
        where: { categoryId: categoryId }
      });

      if (taskCount > 0) {
        throw new Error('Cannot delete category with associated tasks');
      }

      await tx.category.delete({
        where: { id: categoryId }
      });
    });

    return NextResponse.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      if (error.message === 'Cannot delete category with associated tasks') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}