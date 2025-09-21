// src/app/layout.tsx
// This layout provides the basic structure for our app

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
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Header only shows when logged in */}
          {session && (
            <header className="bg-blue-600 text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-xl font-bold">
                  TaskSorter
                </a>
                <Navigation />
              </div>
            </header>
          )}
          
          {/* Main Content */}
          <main className="container mx-auto p-4 min-h-screen">
            {children}
          </main>

          {/* Footer only shows when logged in */}
          {session && (
            <footer className="bg-gray-100 p-4 text-center border-t">
              <p>&copy; {new Date().getFullYear()} TaskSorter. Built with Next.js and Tailwind CSS.</p>
            </footer>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}