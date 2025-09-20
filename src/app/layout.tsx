// src/app/layout.tsx
// This is the main wrapper for every page. We're adding the AuthProvider here.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider"; 
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskSorter - Your Simple Task Manager",
  description: "A clean and simple task management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <-- WE WRAP EVERYTHING IN THIS TAG */}
          {/* Simple Header */}
          <header className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold">
                TaskSorter
              </Link>
              <nav>
                <header className="bg-blue-600 text-white p-4 shadow-md">
  <div className="container mx-auto flex justify-between items-center">
    <Link href="/" className="text-xl font-bold">
      TaskSorter
    </Link>
    <Navigation /> {/* <-- REPLACE THE OLD <nav> WITH THIS */}
  </div>
</header>
              </nav>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="container mx-auto p-4 min-h-screen">
            {children}
          </main>

          {/* Simple Footer */}
          <footer className="bg-gray-100 p-4 text-center border-t">
            <p>&copy; {new Date().getFullYear()} TaskSorter. Built with Next.js and Tailwind CSS.</p>
          </footer>
        </AuthProvider> {/* <-- THIS CLOSES THE TAG */}
      </body>
    </html>
  );
}