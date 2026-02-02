import { NextRequest, NextResponse } from "next/server";
import streamServerClient from "@/lib/stream";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Generate a user token server-side
    const token = streamServerClient.createToken(userId);

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Stream token error:", err);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
