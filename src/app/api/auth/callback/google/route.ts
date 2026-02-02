import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(JSON.stringify({ error: "Invalid OAuth state" }), {
      status: 400,
    });
  }

  try {
    // 🔹 Validate Google authorization code
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    // 🔹 Get user info from Google
    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; name: string }>();

    // 🔹 Check if user already exists
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
    });

    // 🔹 If not, create them
    if (!user) {
      const userId = generateIdFromEntropySize(10);
      const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

      const newUser = await prisma.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.id,
        },
      });

      await streamServerClient.upsertUser({
        id: userId,
        name: googleUser.name,
        username,
      });

      user = newUser;
    }

    // 🔹 Create Stream token for the user
    const streamToken = streamServerClient.createToken(user.id);

    // 🔹 Create a Lucia session and cookie
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // 🔹 Respond with user info + Stream token
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.displayName,
          username: user.username,
        },
        streamToken,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);

    if (error instanceof OAuth2RequestError) {
      return new Response(JSON.stringify({ error: "OAuth2 request failed" }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
