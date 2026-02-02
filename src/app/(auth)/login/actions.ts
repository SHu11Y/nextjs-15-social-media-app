"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import argon2 from "argon2"; // pure JS argon2
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(
  credentials: LoginValues,
): Promise<{ error?: string }> {
  try {
    // Validate input
    const { username, password } = loginSchema.parse(credentials);

    // Find user by username (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!existingUser || !existingUser.passwordHash) {
      return { error: "Incorrect username or password" };
    }

    // Verify password using pure JS argon2
    const validPassword = await argon2.verify(existingUser.passwordHash, password);

    if (!validPassword) {
      return { error: "Incorrect username or password" };
    }

    // Create session and set cookie
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Redirect to homepage
    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return { error: "Something went wrong. Please try again." };
  }
}
