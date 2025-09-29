import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

function isSessionUser(user: unknown): user is SessionUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    typeof (user as SessionUser).id === 'string' &&
    typeof (user as SessionUser).email === 'string'
  );
}

function generateETag(data: unknown): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// GET - Fetch single category with task count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        user: { email: session.user.email || undefined }
      },
      select: {
        id: true,
        name: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        tasks: { select: { id: true } }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const categoryResponse: CategoryResponse = {
      id: category.id,
      name: category.name,
      color: category.color,
      taskCount: category.tasks.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    const etag = generateETag(categoryResponse);
    if (request.headers.get('If-None-Match') === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = NextResponse.json(categoryResponse);
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    return response;

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (!body.color) {
      return NextResponse.json({ error: 'Category color is required' }, { status: 400 });
    }

    const updatedCategory = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({
        where: {
          id: categoryId,
          user: { email: session!.user!.email || undefined }
        }
      });

      if (!category) throw new Error('Category not found');

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
          tasks: { select: { id: true } }
        }
      });
    });

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

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE - Remove category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({
        where: {
          id: categoryId,
          user: { email: session!.user!.email || undefined }
        }
      });

      if (!category) throw new Error('Category not found');

      const taskCount = await tx.taskCategory.count({
        where: { categoryId }
      });

      if (taskCount > 0) {
        throw new Error('Cannot delete category with associated tasks');
      }

      await tx.category.delete({ where: { id: categoryId } });
    });

    return NextResponse.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      if (error.message.includes('associated tasks')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}