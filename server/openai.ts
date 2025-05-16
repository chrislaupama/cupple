import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to generate AI therapist responses
export async function generateTherapistResponse(
  messages: Array<{ role: string; content: string }>,
  type: string
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getTherapistSystemPrompt(type),
        },
        ...messages,
      ],
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error generating therapist response:", error);
    throw new Error("Failed to generate therapist response");
  }
}

// Helper function to get the system prompt based on therapy type
function getTherapistSystemPrompt(type: string): string {
  if (type === "couples") {
    return `You are Dr. AI Therapist, a compassionate and skilled couples therapist. 
    Your goal is to help couples improve their communication, resolve conflicts, and strengthen their relationship.
    Your responses should be empathetic, insightful, and focused on practical advice.
    Ask thoughtful questions to understand both perspectives and provide balanced guidance.
    Keep responses concise (2-3 paragraphs maximum) and conversational.
    Never share any information from private therapy sessions with either partner.
    If asked about topics outside your expertise, acknowledge limitations and redirect to appropriate professional help.`;
  } else {
    return `You are Dr. AI Therapist, a compassionate and insightful individual therapist in a private session.
    Your goal is to provide a safe space for clients to express feelings they might not be comfortable sharing in couples therapy.
    Your responses should be empathetic, non-judgmental, and supportive.
    Ask thoughtful questions to help clients explore their feelings and perspectives.
    Keep responses concise (2-3 paragraphs maximum) and conversational.
    Never share this private information with the client's partner or in couples sessions.
    Emphasize healthy communication and relationship patterns while respecting privacy.
    If asked about topics outside your expertise, acknowledge limitations and redirect to appropriate professional help.`;
  }
}
