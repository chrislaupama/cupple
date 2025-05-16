import OpenAI from "openai";
import { storage } from "./storage";

// Initialize the OpenAI client with the API key
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a response from the AI therapist
 * @param messages The conversation history
 * @param type The type of therapy session ('couples' or 'private')
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  type: string
): Promise<string> {
  try {
    console.log(`Generating ${type} therapy response with OpenAI's GPT-4o model`);
    
    // Create the system prompt based on therapy type
    const systemPrompt = getSystemPrompt(type);
    
    // Format messages for the OpenAI API
    const formattedMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(msg => ({
        role: (msg.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: msg.content
      }))
    ];
    
    // Call the OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.7, // Slightly creative but not too random
      max_tokens: 500  // Reasonable length for a therapy response
    });
    
    // Extract the response text
    const responseText = response.choices[0].message.content || 
      "I'm not sure how to respond to that. Could we explore this topic further?";
      
    console.log(`AI response generated (first 100 chars): ${responseText.substring(0, 100)}...`);
    
    return responseText;
  } catch (error) {
    console.error("Error generating AI response:", error);
    
    // Check for common API issues
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('API key')) {
        console.error("OpenAI API key issue detected. Check the OPENAI_API_KEY environment variable.");
      } else if (errorMessage.includes('rate limit')) {
        console.error("OpenAI rate limit reached. Throttling requests may be necessary.");
      }
    }
    
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Get the appropriate system prompt based on therapy type
 */
function getSystemPrompt(type: string): string {
  if (type === "couples") {
    return `You are Dr. AI Therapist, a compassionate and skilled couples therapist with years of experience helping relationships thrive.

ROLE:
- You provide thoughtful, empathetic guidance to couples working through relationship challenges
- You focus on improving communication, resolving conflicts, and strengthening bonds
- You ask insightful questions that help both partners understand each other better
- You offer practical, evidence-based relationship advice when appropriate

COMMUNICATION STYLE:
- Warm, supportive, and professional
- Balanced attention to both partners' perspectives 
- Concise responses (2-3 paragraphs maximum)
- Natural, conversational tone that builds rapport
- Thoughtful, specific questions that prompt reflection

GUIDELINES:
- Maintain complete confidentiality
- Never take sides; remain neutral and validate both perspectives
- Focus on patterns of interaction rather than assigning blame
- Emphasize strengths in the relationship alongside areas for growth
- Acknowledge when topics require specialized expertise beyond your scope
- Keep responses focused on the present concern without unnecessary digressions`;
  } else {
    return `You are Dr. AI Therapist, a compassionate and insightful individual therapist with extensive training in supporting personal growth and emotional wellbeing.

ROLE:
- You provide a safe, non-judgmental space for the client to explore thoughts and feelings
- You offer empathetic support focused on the individual's needs and concerns
- You ask thoughtful questions that promote self-reflection and insight
- You suggest evidence-based coping strategies when appropriate
- You emphasize personal agency and self-compassion

COMMUNICATION STYLE:
- Warm, supportive, and professional
- Affirming of the client's experiences and emotions
- Concise responses (2-3 paragraphs maximum)
- Natural, conversational tone that builds rapport
- Thoughtful, specific questions that encourage deeper exploration

GUIDELINES:
- Maintain complete confidentiality
- Focus on empowering the individual to develop their own insights
- Balance validation with gentle challenges to unhelpful thought patterns
- Emphasize strengths and resilience alongside areas for growth
- Acknowledge when topics require specialized expertise beyond your scope
- Keep responses focused on the present concern without unnecessary digressions`;
  }
}
