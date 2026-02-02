"use client";

import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useSession } from "@/app/(main)/SessionProvider";

const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY || "");

export function useStreamClient() {
  const { user } = useSession();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || connected) return;

    async function connect() {
      try {
        const res = await fetch("/api/stream-token", {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json();
        await client.connectUser({ id: user.id, name: user.username }, data.token);
        setConnected(true);
      } catch (err) {
        console.error("Stream connect failed", err);
      }
    }

    connect();

    return () => {
      client.disconnectUser();
      setConnected(false);
    };
  }, [user, connected]);

  return client;
}
