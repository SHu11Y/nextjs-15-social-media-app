import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
    });
    if (existingUser) return NextResponse.json({ error: "Username or email already taken" }, { status: 400 });

    const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    const userId = generateIdFromEntropySize(10);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: { id: userId, username, displayName: username, email, passwordHash },
      });
      await streamServerClient.upsertUser({ id: userId, name: username, username });
    });

    // Lucia session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const res = NextResponse.json({ success: true });

    res.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Generate Stream token for frontend
    const streamToken = streamServerClient.createToken(userId);
    res.cookies.set("streamToken", streamToken); // optional cookie
    res.headers.set("x-stream-token", streamToken); // or send in header
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
