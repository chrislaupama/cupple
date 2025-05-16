import OpenAI from "openai";

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Simple, direct approach to getting a therapy response
 */
export async function getSimpleTherapyResponse(message: string, therapyType: string): Promise<string> {
  try {
    // Create appropriate system prompt based on therapy type
    const systemPrompt = therapyType === "couples" 
      ? "You are a compassionate couples therapist helping partners improve communication and resolve conflicts."
      : "You are a supportive individual therapist helping clients process emotions and develop coping strategies.";
    
    // Log the message
    console.log(`Getting ${therapyType} therapy response for: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    
    // Make direct call to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Extract response text
    const responseText = response.choices[0].message.content || 
      "I'm sorry, I'm having trouble understanding. Could you please rephrase that?";
    
    return responseText;
  } catch (error) {
    // Log error and return fallback response
    console.error("Error getting therapy response from OpenAI:", error);
    return "I apologize, but I'm experiencing a temporary technical issue. Please try again in a moment.";
  }
}