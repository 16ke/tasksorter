// src/lib/session.ts
// This file helps us get the current user's session data on the server side.

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}