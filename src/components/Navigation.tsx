// src/components/Navigation.tsx
// This component shows different links based on whether the user is logged in or not.

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return <div className="text-sm">Loading...</div>;
  }

  return (
    <nav>
      <ul className="flex space-x-6 items-center"> {/* Changed from space-x-4 to space-x-6 for more spacing */}
        <li><Link href="/" className="hover:underline">Home</Link></li>
        <li><Link href="/tasks" className="hover:underline">My Tasks</Link></li>
        
        {session ? (
          // If user is logged in, show their name and logout button
          <>
            <li className="text-sm bg-blue-500 px-3 py-1 rounded"> {/* Added background and padding */}
              Hello, {session.user?.name}
            </li>
            <li>
              <button 
                onClick={() => signOut()}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm hover:bg-gray-100"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          // If user is not logged in, show login link
          <li>
            <Link 
              href="/login" 
              className="hover:underline bg-white text-blue-600 px-3 py-1 rounded text-sm" /* Added button style */
            >
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}