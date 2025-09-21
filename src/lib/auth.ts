// src/lib/auth.ts - FIXED VERSION
// This file configures NextAuth to use our database and defines how users can log in.

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
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

        // 4. Check if password matches
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
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  // FIXED CALLBACKS - PROPERLY HANDLE USER ID
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id to the token right after signin
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};