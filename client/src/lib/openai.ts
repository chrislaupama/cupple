import { apiRequest } from "@/lib/queryClient";

export async function sendMessageToAI(message: string, sessionType: string, sessionId: number) {
  try {
    const response = await apiRequest(
      "POST",
      "/api/ai/message",
      {
        message,
        sessionType,
        sessionId
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw error;
  }
}
