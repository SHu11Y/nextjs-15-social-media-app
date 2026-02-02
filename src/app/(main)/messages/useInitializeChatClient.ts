import kyInstance from "@/lib/ky";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useSession } from "../SessionProvider";

export default function useInitializeChatClient() {
  const { user } = useSession();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    console.log("Debug: useInitializeChatClient triggered");
    console.log("User:", user);
    console.log("Stream key:", process.env.NEXT_PUBLIC_STREAM_KEY);

    // Stop initialization if user or key is missing
    if (!user || !process.env.NEXT_PUBLIC_STREAM_KEY) {
      console.warn("⚠️ Missing user or NEXT_PUBLIC_STREAM_KEY — chat init aborted.");
      return;
    }

    // Destructure user after the null check (TS now knows these exist)
    const { id, displayName, username, avatarUrl } = user;

    let isMounted = true;
    const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY);

    async function init() {
      try {
        console.log("🔹 Fetching chat token from /api/get-token...");
        const { token } = await kyInstance.get("/api/get-token").json<{ token: string }>();
        console.log("✅ Token received:", token ? "yes" : "no");

        console.log("🔹 Connecting user to StreamChat...");
        await client.connectUser(
          {
            id,
            name: displayName ?? username,
            image: avatarUrl ?? undefined,
          },
          token
        );
        console.log("✅ StreamChat connected!");

        if (isMounted) setChatClient(client);
      } catch (err) {
        console.error("❌ Chat initialization failed:", err);
      }
    }

    init();

    return () => {
      isMounted = false;
      client
        .disconnectUser()
        .then(() => console.log("🔹 Chat client disconnected"))
        .catch((err) => console.error("⚠️ Chat cleanup failed:", err));
      setChatClient(null);
    };
  }, [user?.id]);

  return chatClient;
}
