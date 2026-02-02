import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";

export async function POST() {
  try {
    // Get all users from database
    const users = await prisma.user.findMany();

    // Create them in Stream Chat
    for (const user of users) {
      await streamServerClient.upsertUser({
        id: user.id,
        name: user.displayName,
        username: user.username,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${users.length} users` 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fix users" }, { status: 500 });
  }
}
