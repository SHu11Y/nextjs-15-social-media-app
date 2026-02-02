import { StreamChat } from "stream-chat";

let client: StreamChat | null = null;

export const getStreamClient = () => {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    client = StreamChat.getInstance(apiKey);
  }
  return client;
};
