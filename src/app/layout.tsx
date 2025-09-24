// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskSorter - Your Simple Task Manager",
  description: "A clean and simple task management application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {/* Header only shows when logged in */}
          {session && (
            <header className="bg-[var(--turquoise-500)] text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-xl font-bold">
                  TaskSorter
                </a>
                <Navigation />
              </div>
            </header>
          )}
          
          {/* Main Content - Pattern will now show behind everything */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer only shows when logged in - Updated for dark mode */}
          {session && (
            <footer className="bg-gray-100 p-4 text-center border-t dark:bg-gray-800 dark:text-white dark:border-gray-700">
              <p>&copy; {new Date().getFullYear()} TaskSorter. Built with Next.js and Tailwind CSS.</p>
            </footer>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}