// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-body'
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-elegant'
});

export const metadata: Metadata = {
  title: "Vezir - Your Trusted Task Manager Advisor",
  description: "A task management application that serves you faithfully",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body">
        <AuthProvider>
          {/* Header only shows when logged in */}
          {session && (
            <header className="bg-[var(--turquoise-500)] text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <a href="/" className="text-3xl font-elegant font-bold tracking-tight">
                  Vezir
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
              <p>&copy; {new Date().getFullYear()} Vezir. Built with Next.js and Tailwind CSS.</p>
            </footer>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}