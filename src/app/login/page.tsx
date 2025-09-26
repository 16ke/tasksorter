// src/app/login/page.tsx
// This is the login page where users can sign in to their account.

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LargeLogo from "@/components/LargeLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the return URL from query parameters or default to homepage
  const returnUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      // Redirect to the return URL (or homepage) instead of hardcoding "/tasks"
      router.push(returnUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 border-gold-lg">
        <div className="text-center mb-6">
          {/* Large Logo */}
          <LargeLogo />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--turquoise-500)] to-purple-600 bg-clip-text text-transparent font-elegant">
            Vezir
          </h1>
          <p className="text-white mt-2 font-body">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-300 font-body">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 font-body">
              📧 Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] bg-card text-foreground border-gold-lg font-body transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2 font-body">
              🔒 Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] bg-card text-foreground border-gold-lg font-body transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white py-3 px-4 rounded-xl hover:from-[var(--turquoise-700)] hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] disabled:opacity-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl border border-gold-lg font-body"
          >
            {isLoading ? "🔄 Signing in..." : "🗝️ Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted font-body">
          Don't have an account?{" "}
          <Link href="/register" className="text-[var(--turquoise-500)] hover:underline transition-colors font-body">
            🏛️ Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}