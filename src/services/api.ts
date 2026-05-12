import { Message } from "../types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/chat/";

export async function sendMessage(message: string, history: Message[], signal?: AbortSignal): Promise<string> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-5) }),
    signal,
  });
  
  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(json.error || "Network error");
  }

  return json.response || json.error || "Error.";
}
