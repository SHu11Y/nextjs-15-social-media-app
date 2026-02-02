"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";

interface StreamProviderProps {
  userId: string;
  token: string;
  children: ReactNode;
}

export default function StreamProvider({ userId, token, children }: StreamProviderProps) {
  const [client, setClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    if (!userId || !token) return;

    const chatClient = new StreamChat(process.env.NEXT_PUBLIC_STREAM_KEY!);
    chatClient.connectUser(
      { id: userId, name: userId },
      token
    );
    setClient(chatClient);

    return () => {
      chatClient.disconnectUser();
    };
  }, [userId, token]);

  if (!client) return null;

  return <>{children}</>;
}
