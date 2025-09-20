import { prisma } from '@/lib/prisma';

export default async function Home() {
  // Try to count the tasks in the database
  const taskCount = await prisma.task.count();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold">Welcome to TaskSorter</h1>
      <p className="text-lg mt-4">Your total number of tasks is: <strong>{taskCount}</strong></p>
    </main>
  );
}