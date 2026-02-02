import { validateRequest } from "@/auth";
import streamServerClient from "@/lib/stream";
import { MessageCountInfo } from "@/lib/types";

export async function GET() {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { total_unread_count } = await streamServerClient.getUnreadCount(
        user.id,
      );

      const data: MessageCountInfo = {
        unreadCount: total_unread_count,
      };

      return Response.json(data);
    } catch (streamError: any) {
      // If user doesn't exist (code 16), create them and return 0
      if (streamError.code === 16) {
        await streamServerClient.upsertUser({
          id: user.id,
          username: user.username,
          name: user.displayName,
          image: user.avatarUrl,
        });
        
        return Response.json({ unreadCount: 0 } as MessageCountInfo);
      }
      throw streamError;
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}