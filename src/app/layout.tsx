import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Logo from "@/components/Logo";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-body'
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-elegant'
});

export const metadata: Metadata = {
  title: "Vezir - Task Manager App",
  description: "A task manager that serves you faithfully",
  icons: {
    icon: '/vezir-favicon.svg',
    shortcut: '/vezir-favicon.svg',
    apple: '/vezir-favicon.svg',
  },
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
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Logo />
                  <span className="text-3xl font-elegant font-bold tracking-tight">
                    Vezir
                  </span>
                </Link>
                <Navigation />
              </div>
            </header>
          )}
          
          <main className="min-h-screen">
            {children}
          </main>

          {session && (
            <footer className="bg-[var(--surface)] p-4 text-center border-t border-[var(--border)]">
              <p className="text-[var(--foreground)]">&copy; {new Date().getFullYear()} Vezir. Built with Next.js and Tailwind CSS.</p>
            </footer>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}