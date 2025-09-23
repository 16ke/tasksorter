import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        tasks: {
          select: {
            taskId: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform categories to include task count with proper typing
    const categoriesWithTaskCount = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      taskCount: category.tasks.length,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }));

    return NextResponse.json({ categories: categoriesWithTaskCount });
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#3b82f6',
        userId: user.id
      }
    });

    // Return with taskCount set to 0 for new categories
    const categoryWithTaskCount = {
      id: category.id,
      name: category.name,
      color: category.color,
      userId: category.userId,
      taskCount: 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };

    return NextResponse.json({ category: categoryWithTaskCount }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}