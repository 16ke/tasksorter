// src/lib/auth.ts
// This file configures NextAuth to use our database and defines how users can log in.

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Check if user provided both email and password
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 2. Find the user in the database
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        // 3. If user doesn't exist, return null
        if (!user) {
          return null;
        }

        // 4. Check if password matches (we'll implement this properly later)
        // For now, we'll use a simple check
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword || ""
        );

        // 5. If password doesn't match, return null
        if (!isPasswordValid) {
          return null;
        }

        // 6. If everything is good, return the user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login", // This tells NextAuth to use our custom login page
  },
};