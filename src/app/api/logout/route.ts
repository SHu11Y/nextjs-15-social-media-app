import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/auth";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session")?.value;
  if (sessionId) await lucia.invalidateSession(sessionId);

  const res = NextResponse.json({ success: true });
  res.cookies.delete("session");
  res.cookies.delete("stream-token");
  return res;
}
