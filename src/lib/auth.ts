// src/lib/auth.ts 
// This file configures NextAuth to use our database and defines how users can log in.

import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

interface Credentials {
  email?: string;
  password?: string;
}

interface JWT {
  id?: string;
  sub?: string;
  [key: string]: unknown;
}

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface Session {
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
}

interface JWTParams {
  token: JWT;
  user?: User;
}

interface SessionParams {
  session: Session;
  token: JWT;
}

// For NextAuth v4, we use inline configuration without explicit types
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Credentials | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword || ""
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  
  session: {
    strategy: "jwt" as const
  },
  
  pages: {
    signIn: "/login",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    async jwt({ token, user }: JWTParams) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }: SessionParams) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
};